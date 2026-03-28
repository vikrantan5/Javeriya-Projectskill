from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import UserBanRequest, PlatformMessageCreate
from app.utils.auth import get_current_admin_user
from app.database import get_db
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/users")
async def get_all_users(current_admin_id: str = Depends(get_current_admin_user)):
    """Get all users with statistics"""
    try:
        db = get_db()
        
        users_result = db.table('users').select('id, email, username, full_name, is_active, is_banned, is_verified, role, average_rating, total_ratings, total_sessions, total_tasks_completed, created_at, last_login').order('created_at', desc=True).execute()
        
        return users_result.data if users_result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/users/{user_id}/ban")
async def ban_user(user_id: str, ban_data: UserBanRequest, current_admin_id: str = Depends(get_current_admin_user)):
    """Ban a user"""
    try:
        db = get_db()
        
        # Check if user exists
        user_result = db.table('users').select('id, username').eq('id', user_id).execute()
        
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update user
        db.table('users').update({
            'is_banned': True,
            'is_active': False
        }).eq('id', user_id).execute()
        
        # Log the ban
        fraud_log = {
            'user_id': user_id,
            'fraud_type': 'admin_ban',
            'severity': 'high',
            'description': ban_data.reason,
            'action_taken': f'banned_by_admin_{ban_data.duration_days or "permanent"}_days'
        }
        db.table('fraud_logs').insert(fraud_log).execute()
        
        # Create notification
        notification = {
            'user_id': user_id,
            'title': 'Account Banned',
            'message': f'Your account has been banned. Reason: {ban_data.reason}',
            'notification_type': 'system'
        }
        db.table('notifications').insert(notification).execute()
        
        return {
            "message": "User banned successfully",
            "user_id": user_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error banning user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/users/{user_id}/unban")
async def unban_user(user_id: str, current_admin_id: str = Depends(get_current_admin_user)):
    """Unban a user"""
    try:
        db = get_db()
        
        # Update user
        db.table('users').update({
            'is_banned': False,
            'is_active': True
        }).eq('id', user_id).execute()
        
        # Create notification
        notification = {
            'user_id': user_id,
            'title': 'Account Unbanned',
            'message': 'Your account has been unbanned. Welcome back!',
            'notification_type': 'system'
        }
        db.table('notifications').insert(notification).execute()
        
        return {
            "message": "User unbanned successfully",
            "user_id": user_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unbanning user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/tasks")
async def get_all_tasks(current_admin_id: str = Depends(get_current_admin_user)):
    """Get all tasks for monitoring"""
    try:
        db = get_db()
        
        tasks_result = db.table('tasks').select('id, title, status, price, creator_id, acceptor_id, created_at, deadline').order('created_at', desc=True).execute()
        
        return tasks_result.data if tasks_result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/sessions")
async def get_all_sessions(current_admin_id: str = Depends(get_current_admin_user)):
    """Get all sessions for monitoring"""
    try:
        db = get_db()
        
        sessions_result = db.table('learning_sessions').select('id, mentor_id, learner_id, skill_name, status, scheduled_at, created_at').order('created_at', desc=True).execute()
        
        return sessions_result.data if sessions_result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching sessions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/fraud-logs")
async def get_fraud_logs(current_admin_id: str = Depends(get_current_admin_user)):
    """Get fraud detection logs"""
    try:
        db = get_db()
        
        logs_result = db.table('fraud_logs').select('*').order('created_at', desc=True).limit(100).execute()
        
        if not logs_result.data:
            return []
        
        # Get user details
        user_ids = list(set([log['user_id'] for log in logs_result.data]))
        users_result = db.table('users').select('id, username, email').in_('id', user_ids).execute()
        
        users_dict = {user['id']: user for user in users_result.data}
        
        results = []
        for log in logs_result.data:
            user = users_dict.get(log['user_id'])
            if user:
                results.append({
                    'log': log,
                    'user': user
                })
        
        return results
    
    except Exception as e:
        logger.error(f"Error fetching fraud logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/analytics")
async def get_platform_analytics(current_admin_id: str = Depends(get_current_admin_user)):
    """Get platform analytics and statistics"""
    try:
        db = get_db()
        
        # Get counts
        users_count = len(db.table('users').select('id').execute().data or [])
        tasks_count = len(db.table('tasks').select('id').execute().data or [])
        sessions_count = len(db.table('learning_sessions').select('id').execute().data or [])
        
        # Get revenue (sum of completed payments)
        payments_result = db.table('payments').select('amount').eq('status', 'released').execute()
        total_revenue = sum([p['amount'] for p in (payments_result.data or [])]) if payments_result.data else 0
        
        # Get active users (logged in last 7 days)
        # This is a simplified version
        active_users = len(db.table('users').select('id').eq('is_active', True).execute().data or [])
        
        # Get tasks by status
        open_tasks = len(db.table('tasks').select('id').eq('status', 'open').execute().data or [])
        completed_tasks = len(db.table('tasks').select('id').eq('status', 'completed').execute().data or [])
        
        return {
            "total_users": users_count,
            "active_users": active_users,
            "total_tasks": tasks_count,
            "open_tasks": open_tasks,
            "completed_tasks": completed_tasks,
            "total_sessions": sessions_count,
            "total_revenue": total_revenue,
            "currency": "INR"
        }
    
    except Exception as e:
        logger.error(f"Error fetching analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/messages")
async def create_platform_message(message_data: PlatformMessageCreate, current_admin_id: str = Depends(get_current_admin_user)):
    """Create a platform-wide message/announcement"""
    try:
        db = get_db()
        
        new_message = {
            'title': message_data.title,
            'message': message_data.message,
            'message_type': message_data.message_type,
            'is_active': True,
            'created_by': current_admin_id,
            'expires_at': message_data.expires_at.isoformat() if message_data.expires_at else None
        }
        
        result = db.table('platform_messages').insert(new_message).execute()
        
        return {
            "message": "Platform message created successfully",
            "platform_message": result.data[0]
        }
    
    except Exception as e:
        logger.error(f"Error creating platform message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    



@router.get("/skill-exchanges")
async def get_all_skill_exchanges(current_admin_id: str = Depends(get_current_admin_user)):
    """Get all skill exchange tasks for monitoring"""
    try:
        db = get_db()
        
        exchanges_result = db.table('skill_exchange_tasks').select('*').order('created_at', desc=True).execute()
        
        return exchanges_result.data if exchanges_result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching skill exchanges: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/transactions")
async def get_all_transactions(current_admin_id: str = Depends(get_current_admin_user)):
    """Get all payment transactions for monitoring"""
    try:
        db = get_db()
        
        payments_result = db.table('payments').select('*').order('created_at', desc=True).execute()
        
        if not payments_result.data:
            return []
        
        # Get user details for payers and payees
        user_ids = list(set([p['payer_id'] for p in payments_result.data if p.get('payer_id')] + 
                           [p['payee_id'] for p in payments_result.data if p.get('payee_id')]))
        users_result = db.table('users').select('id, username, email, full_name').in_('id', user_ids).execute()
        
        users_dict = {user['id']: user for user in (users_result.data or [])}
        
        # Combine payment data with user details
        transactions = []
        for payment in payments_result.data:
            transactions.append({
                **payment,
                'payer': users_dict.get(payment['payer_id']),
                'payee': users_dict.get(payment['payee_id'])
            })
        
        return transactions
    
    except Exception as e:
        logger.error(f"Error fetching transactions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_admin_id: str = Depends(get_current_admin_user)):
    """Delete a task (Admin only)"""
    try:
        db = get_db()
        
        # Get task before deleting
        task_result = db.table('tasks').select('*').eq('id', task_id).execute()
        
        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        task = task_result.data[0]
        
        # Delete task
        db.table('tasks').delete().eq('id', task_id).execute()
        
        # Notify task creator
        db.table('notifications').insert({
            'user_id': task['creator_id'],
            'title': 'Task Removed by Admin',
            'message': f'Your task "{task["title"]}" has been removed by the admin team.',
            'notification_type': 'admin_action',
            'reference_id': task_id,
            'reference_type': 'task'
        }).execute()
        
        return {"message": "Task deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/skill-exchanges/{exchange_id}")
async def delete_skill_exchange(exchange_id: str, current_admin_id: str = Depends(get_current_admin_user)):
    """Delete a skill exchange task (Admin only)"""
    try:
        db = get_db()
        
        # Get exchange before deleting
        exchange_result = db.table('skill_exchange_tasks').select('*').eq('id', exchange_id).execute()
        
        if not exchange_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill exchange not found"
            )
        
        exchange = exchange_result.data[0]
        
        # Delete exchange
        db.table('skill_exchange_tasks').delete().eq('id', exchange_id).execute()
        
        # Notify creator
        db.table('notifications').insert({
            'user_id': exchange['creator_id'],
            'title': 'Skill Exchange Removed by Admin',
            'message': f'Your skill exchange post has been removed by the admin team.',
            'notification_type': 'admin_action',
            'reference_id': exchange_id,
            'reference_type': 'skill_exchange'
        }).execute()
        
        return {"message": "Skill exchange deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting skill exchange: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )



# =====================================================
# ESCROW PAYMENT MANAGEMENT ENDPOINTS
# =====================================================

@router.get("/escrow/payments")
async def get_escrow_payments(current_admin_id: str = Depends(get_current_admin_user)):
    """Get all escrow payments for monitoring"""
    try:
        db = get_db()
        
        # Get all payments with escrow status
        payments_result = db.table('payments').select('*').eq('is_escrowed', True).order('created_at', desc=True).execute()
        
        if not payments_result.data:
            return []
        
        # Get user details for payers and payees
        user_ids = list(set([p['payer_id'] for p in payments_result.data if p.get('payer_id')] + 
                           [p['payee_id'] for p in payments_result.data if p.get('payee_id')]))
        users_result = db.table('users').select('id, username, email, full_name').in_('id', user_ids).execute()
        users_dict = {user['id']: user for user in (users_result.data or [])}
        
        # Get task details
        task_ids = list(set([p['task_id'] for p in payments_result.data if p.get('task_id')]))
        tasks_result = db.table('tasks').select('id, title, status').in_('id', task_ids).execute()
        tasks_dict = {task['id']: task for task in (tasks_result.data or [])}
        
        # Combine payment data with user and task details
        escrow_payments = []
        for payment in payments_result.data:
            escrow_payments.append({
                **payment,
                'payer': users_dict.get(payment['payer_id']),
                'payee': users_dict.get(payment['payee_id']),
                'task': tasks_dict.get(payment['task_id'])
            })
        
        return escrow_payments
    
    except Exception as e:
        logger.error(f"Error fetching escrow payments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/escrow/refunds")
async def get_escrow_refunds(current_admin_id: str = Depends(get_current_admin_user)):
    """Get all refunded escrow payments"""
    try:
        db = get_db()
        
        # Get all refunded payments
        refunds_result = db.table('payments').select('*').eq('status', 'refunded').order('updated_at', desc=True).execute()
        
        if not refunds_result.data:
            return []
        
        # Get user details
        user_ids = list(set([r['payer_id'] for r in refunds_result.data if r.get('payer_id')]))
        users_result = db.table('users').select('id, username, email, full_name').in_('id', user_ids).execute()
        users_dict = {user['id']: user for user in (users_result.data or [])}
        
        # Get task details
        task_ids = list(set([r['task_id'] for r in refunds_result.data if r.get('task_id')]))
        tasks_result = db.table('tasks').select('id, title, status, cancel_reason').in_('id', task_ids).execute()
        tasks_dict = {task['id']: task for task in (tasks_result.data or [])}
        
        # Combine data
        refunds_with_details = []
        for refund in refunds_result.data:
            refunds_with_details.append({
                **refund,
                'payer': users_dict.get(refund['payer_id']),
                'task': tasks_dict.get(refund['task_id'])
            })
        
        return refunds_with_details
    
    except Exception as e:
        logger.error(f"Error fetching refunds: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/banned-users")
async def get_banned_users(current_admin_id: str = Depends(get_current_admin_user)):
    """Get all banned users"""
    try:
        db = get_db()
        
        # Get all banned users
        banned_users_result = db.table('users').select('id, email, username, full_name, is_banned, ban_reason, banned_at, report_count, created_at').eq('is_banned', True).order('banned_at', desc=True).execute()
        
        return banned_users_result.data if banned_users_result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching banned users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/disputes")
async def get_all_admin_disputes(
    status_filter: str = None,
    current_admin_id: str = Depends(get_current_admin_user)
):
    """Get all disputes (Admin only) - alias for disputes route"""
    try:
        db = get_db()
        
        query = db.table('task_disputes').select('*')
        
        if status_filter:
            query = query.eq('status', status_filter)
        
        disputes_result = query.order('created_at', desc=True).execute()
        
        if not disputes_result.data:
            return []
        
        # Get user details
        user_ids = list(set([d['raised_by'] for d in disputes_result.data] + [d['against_user_id'] for d in disputes_result.data]))
        users_result = db.table('users').select('id, username, email, full_name').in_('id', user_ids).execute()
        users_dict = {user['id']: user for user in (users_result.data or [])}
        
        # Get task details
        task_ids = list(set([d['task_id'] for d in disputes_result.data]))
        tasks_result = db.table('tasks').select('id, title, status, price').in_('id', task_ids).execute()
        tasks_dict = {task['id']: task for task in (tasks_result.data or [])}
        
        # Combine data
        disputes_with_details = []
        for dispute in disputes_result.data:
            disputes_with_details.append({
                **dispute,
                'raised_by_user': users_dict.get(dispute['raised_by']),
                'against_user': users_dict.get(dispute['against_user_id']),
                'task': tasks_dict.get(dispute['task_id'])
            })
        
        return disputes_with_details
    
    except Exception as e:
        logger.error(f"Error fetching disputes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/escrow/payments/{payment_id}/release")
async def admin_release_payment(payment_id: str, current_admin_id: str = Depends(get_current_admin_user)):
    """Manually release escrowed payment (Admin only)"""
    try:
        db = get_db()
        
        # Get payment
        payment_result = db.table('payments').select('*').eq('id', payment_id).execute()
        
        if not payment_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        payment = payment_result.data[0]
        
        # Update payment status
        db.table('payments').update({
            'status': 'released',
            'escrow_status': 'RELEASED',
            'released_at': datetime.now(timezone.utc).isoformat()
        }).eq('id', payment_id).execute()
        
        # Notify payee
        if payment.get('payee_id'):
            db.table('notifications').insert({
                'user_id': payment['payee_id'],
                'title': '💰 Payment Released by Admin',
                'message': f'Payment of ₹{payment["amount"]} has been released to you by admin.',
                'notification_type': 'payment',
                'reference_id': payment_id,
                'reference_type': 'payment'
            }).execute()
        
        # Log admin action
        db.table('admin_actions').insert({
            'admin_id': current_admin_id,
            'action_type': 'payment_released',
            'target_type': 'payment',
            'target_id': payment_id,
            'action_details': {'amount': payment['amount'], 'payee_id': payment.get('payee_id')},
            'reason': 'Admin manual release'
        }).execute()
        
        return {"message": "Payment released successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error releasing payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/escrow/payments/{payment_id}/refund")
async def admin_refund_payment(payment_id: str, reason: str = "Admin refund", current_admin_id: str = Depends(get_current_admin_user)):
    """Manually refund escrowed payment (Admin only)"""
    try:
        db = get_db()
        
        # Get payment
        payment_result = db.table('payments').select('*').eq('id', payment_id).execute()
        
        if not payment_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        payment = payment_result.data[0]
        
        # Update payment status
        db.table('payments').update({
            'status': 'refunded',
            'escrow_status': 'REFUNDED',
            'refunded_at': datetime.now(timezone.utc).isoformat()
        }).eq('id', payment_id).execute()
        
        # Notify payer
        db.table('notifications').insert({
            'user_id': payment['payer_id'],
            'title': '🔄 Payment Refunded by Admin',
            'message': f'Payment of ₹{payment["amount"]} has been refunded to you by admin. Reason: {reason}',
            'notification_type': 'payment',
            'reference_id': payment_id,
            'reference_type': 'payment'
        }).execute()
        
        # Log admin action
        db.table('admin_actions').insert({
            'admin_id': current_admin_id,
            'action_type': 'payment_refunded',
            'target_type': 'payment',
            'target_id': payment_id,
            'action_details': {'amount': payment['amount'], 'payer_id': payment['payer_id']},
            'reason': reason
        }).execute()
        
        return {"message": "Payment refunded successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refunding payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )