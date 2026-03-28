from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import ReportCreate, ReportResponse, ReportUpdate
from app.utils.auth import get_current_user, get_current_admin_user
from app.database import get_db
from typing import List
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["Reports"])

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_report(report_data: ReportCreate, current_user_id: str = Depends(get_current_user)):
    """Create a new report - enhanced with report_type and reported_user_id"""
    try:
        db = get_db()
        
        # Create report
        new_report = {
            'reporter_id': current_user_id,
            'reported_entity_type': report_data.reported_entity_type,
            'reported_entity_id': str(report_data.reported_entity_id),
            'reported_user_id': str(report_data.reported_user_id) if report_data.reported_user_id else None,
            'report_type': report_data.report_type,
            'reason': report_data.reason,
            'description': report_data.description,
            'attachments': report_data.attachments or report_data.screenshots or [],
            'status': 'pending'
        }
        
        result = db.table('reports').insert(new_report).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create report"
            )
        
        created_report = result.data[0]
        
        # Increment report count for reported user
        if report_data.reported_user_id:
            user_result = db.table('users').select('report_count').eq('id', str(report_data.reported_user_id)).execute()
            if user_result.data:
                current_count = user_result.data[0].get('report_count', 0)
                new_count = current_count + 1
                
                # Update report count
                db.table('users').update({
                    'report_count': new_count
                }).eq('id', str(report_data.reported_user_id)).execute()
                
                # Auto-block if report count >= 3
                if new_count >= 3:
                    logger.warning(f"[AUTO-BLOCK] User {report_data.reported_user_id} has {new_count} reports. Auto-blocking.")
                    
                    db.table('users').update({
                        'is_banned': True,
                        'is_active': False,
                        'ban_reason': f'Auto-banned after receiving {new_count} reports',
                        'banned_at': utc_now_iso()
                    }).eq('id', str(report_data.reported_user_id)).execute()
                    
                    # Notify the banned user
                    db.table('notifications').insert({
                        'user_id': str(report_data.reported_user_id),
                        'title': '🚫 Account Blocked',
                        'message': f'Your account has been blocked after receiving multiple reports. Contact admin for review.',
                        'notification_type': 'system'
                    }).execute()
        
        # Notify all admins
        admins_result = db.table('users').select('id').eq('role', 'admin').execute()
        
        if admins_result.data:
            for admin in admins_result.data:
                db.table('notifications').insert({
                    'user_id': admin['id'],
                    'title': '📢 New Report Submitted',
                    'message': f'A new {report_data.report_type} report has been submitted: {report_data.reason}',
                    'notification_type': 'report',
                    'reference_id': created_report['id'],
                    'reference_type': 'report'
                }).execute()
        
        return {
            "message": "Report submitted successfully. Our team will review it shortly.",
            "report": created_report
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/my-reports", response_model=List[dict])
async def get_my_reports(current_user_id: str = Depends(get_current_user)):
    """Get reports created by current user"""
    try:
        db = get_db()
        
        reports_result = db.table('reports').select('*').eq('reporter_id', current_user_id).order('created_at', desc=True).execute()
        
        return reports_result.data if reports_result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching my reports: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/", response_model=List[dict])
async def get_all_reports(
    status_filter: str = None,
    current_admin_id: str = Depends(get_current_admin_user)
):
    """Get all reports (Admin only)"""
    try:
        db = get_db()
        
        query = db.table('reports').select('*')
        
        if status_filter:
            query = query.eq('status', status_filter)
        
        reports_result = query.order('created_at', desc=True).execute()
        
        if not reports_result.data:
            return []
        
        # Get reporter details
        reporter_ids = list(set([report['reporter_id'] for report in reports_result.data]))
        users_result = db.table('users').select('id, username, email, full_name').in_('id', reporter_ids).execute()
        
        users_dict = {user['id']: user for user in (users_result.data or [])}
        
        # Combine report data with user details
        reports_with_details = []
        for report in reports_result.data:
            reporter = users_dict.get(report['reporter_id'])
            reports_with_details.append({
                **report,
                'reporter': reporter
            })
        
        return reports_with_details
    
    except Exception as e:
        logger.error(f"Error fetching reports: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{report_id}", response_model=dict)
async def get_report(report_id: str, current_admin_id: str = Depends(get_current_admin_user)):
    """Get report by ID (Admin only)"""
    try:
        db = get_db()
        
        report_result = db.table('reports').select('*').eq('id', report_id).execute()
        
        if not report_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        report = report_result.data[0]
        
        # Get reporter details
        reporter_result = db.table('users').select('id, username, email, full_name').eq('id', report['reporter_id']).execute()
        
        return {
            'report': report,
            'reporter': reporter_result.data[0] if reporter_result.data else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.patch("/{report_id}", response_model=dict)
async def update_report(
    report_id: str,
    report_update: ReportUpdate,
    current_admin_id: str = Depends(get_current_admin_user)
):
    """Update report status (Admin only)"""
    try:
        db = get_db()
        
        # Get report
        report_result = db.table('reports').select('*').eq('id', report_id).execute()
        
        if not report_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        report = report_result.data[0]
        
        # Update report
        update_data = {
            'status': report_update.status,
            'admin_notes': report_update.admin_notes,
            'reviewed_by': current_admin_id,
            'reviewed_at': utc_now_iso()
        }
        
        db.table('reports').update(update_data).eq('id', report_id).execute()
        
        # Notify reporter
        db.table('notifications').insert({
            'user_id': report['reporter_id'],
            'title': 'Report Updated',
            'message': f'Your report has been {report_update.status}.',
            'notification_type': 'report_update',
            'reference_id': report_id,
            'reference_type': 'report'
        }).execute()
        
        return {
            "message": "Report updated successfully",
            "report_id": report_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{report_id}")
async def delete_report(report_id: str, current_admin_id: str = Depends(get_current_admin_user)):
    """Delete a report (Admin only)"""
    try:
        db = get_db()
        
        db.table('reports').delete().eq('id', report_id).execute()
        
        return {"message": "Report deleted successfully"}
    
    except Exception as e:
        logger.error(f"Error deleting report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
