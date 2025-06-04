from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import threading
import atexit
from services.ircc_checker import ircc_checker
from config import Config
import logging

logger = logging.getLogger(__name__)

class TaskScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.is_running = False
        self.worker_thread = None
        self.stop_event = threading.Event()
        
        # Register cleanup function for program exit
        atexit.register(self.shutdown)
    
    def start(self):
        """Start scheduler"""
        if not self.is_running:
            try:
                # Add scheduled task - check IRCC status every 10 minutes
                self.scheduler.add_job(
                    func=self._check_ircc_status_job,
                    trigger=IntervalTrigger(minutes=Config.CHECK_INTERVAL_MINUTES),
                    id='ircc_status_check',
                    name='IRCC Status Check Task',
                    replace_existing=True
                )
                
                # Start scheduler
                self.scheduler.start()
                self.is_running = True
                
                # Start background worker thread
                self.start_worker_thread()
                
                logger.info(f"Task scheduler started, check interval: {Config.CHECK_INTERVAL_MINUTES} minutes")
                
                # Execute check immediately once
                self._check_ircc_status_job()
                
            except Exception as e:
                logger.error(f"Failed to start scheduler: {str(e)}")
    
    def stop(self):
        """Stop scheduler"""
        if self.is_running:
            try:
                self.scheduler.shutdown()
                self.is_running = False
                
                # Stop worker thread
                self.stop_worker_thread()
                
                logger.info("Task scheduler stopped")
            except Exception as e:
                logger.error(f"Failed to stop scheduler: {str(e)}")
    
    def start_worker_thread(self):
        """Start background worker thread"""
        if self.worker_thread is None or not self.worker_thread.is_alive():
            self.stop_event.clear()
            self.worker_thread = threading.Thread(
                target=self._worker_loop,
                name='IRCCWorkerThread',
                daemon=True
            )
            self.worker_thread.start()
            logger.info("Background worker thread started")
    
    def stop_worker_thread(self):
        """Stop background worker thread"""
        if self.worker_thread and self.worker_thread.is_alive():
            self.stop_event.set()
            self.worker_thread.join(timeout=5.0)
            logger.info("Background worker thread stopped")
    
    def _worker_loop(self):
        """Main loop of worker thread"""
        logger.info("Worker thread started running")
        
        while not self.stop_event.is_set():
            try:
                # Other tasks that need to be executed in background can be added here
                # Currently main checking tasks are handled by scheduler
                
                # Wait 10 seconds before next loop
                if self.stop_event.wait(timeout=10):
                    break
                    
            except Exception as e:
                logger.error(f"Error occurred during worker thread execution: {str(e)}")
                # Wait for a while before continuing when error occurs
                if self.stop_event.wait(timeout=30):
                    break
        
        logger.info("Worker thread exited")
    
    def _check_ircc_status_job(self):
        """IRCC status check task"""
        try:
            logger.info("Starting IRCC status check task")
            start_time = datetime.now()
            
            # Execute status check
            success_count, total_count = ircc_checker.check_all_credentials()
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            logger.info(f"IRCC status check task completed - Duration: {duration:.2f}s, Success: {success_count}/{total_count}")
            
        except Exception as e:
            logger.error(f"Error occurred during IRCC status check task: {str(e)}")
    
    def add_one_time_job(self, func, *args, **kwargs):
        """Add one-time task"""
        try:
            job_id = f"one_time_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            self.scheduler.add_job(
                func=func,
                args=args,
                kwargs=kwargs,
                id=job_id,
                name='One-time Task'
            )
            logger.info(f"One-time task added: {job_id}")
            return job_id
        except Exception as e:
            logger.error(f"Failed to add one-time task: {str(e)}")
            return None
    
    def get_job_status(self):
        """Get task status information"""
        jobs = self.scheduler.get_jobs()
        job_info = []
        
        for job in jobs:
            job_info.append({
                'id': job.id,
                'name': job.name,
                'next_run_time': job.next_run_time.strftime('%Y-%m-%d %H:%M:%S') if job.next_run_time else None,
                'trigger': str(job.trigger)
            })
        
        return {
            'is_running': self.is_running,
            'worker_thread_alive': self.worker_thread.is_alive() if self.worker_thread else False,
            'jobs': job_info,
            'total_jobs': len(jobs)
        }
    
    def shutdown(self):
        """Cleanup function for program exit"""
        self.stop()

# Global scheduler instance
task_scheduler = TaskScheduler() 