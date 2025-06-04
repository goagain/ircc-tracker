import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime
from services.ircc_checker import IRCCChecker
from models.application_records import ApplicationRecord
class TestCompareApplicationDetails(unittest.TestCase):
    def setUp(self):
        """Setup test data"""
        self.old_details = ApplicationRecord.from_dict({
            'applicationNumber': 'C000123456',
            'uci': '1234567890',
            'status': 'In Progress',
            'lastUpdatedTime': '2024-01-01T10:00:00Z',
            'activities': [
                {
                    'type': 'Language Test',
                    'status': 'Not Started',
                    'order': 1
                },
                {
                    'type': 'Background Verification',
                    'status': 'Not Started',
                    'order': 2
                }
            ]
        }
        
        self.new_details = ApplicationRecord.from_dict({
            'applicationNumber': 'C000123456',
            'uci': '1234567890',
            'status': 'In Progress',
            'lastUpdatedTime': '2024-01-02T10:00:00Z',
            'activities': [
                {
                    'type': 'Language Test',
                    'status': 'Completed',
                    'order': 1
                },
                {
                    'type': 'Background Verification',
                    'status': 'In Progress',
                    'order': 2
                }
            ]
        }

    def test_no_changes(self):
        """Test no changes"""
        result = IRCCChecker.compare_application_details(self.old_details, self.old_details)
        self.assertEqual(len(result), 0)

    def test_activity_status_changes(self):
        """Test activity status changes"""
        result = IRCCChecker.compare_application_details(self.old_details, self.new_details)
        
        self.assertTrue(result)
        self.assertEqual(len(result), 2)
        
        # verify language test status change
        language_test_change = next(
            change for change in result 
            if change['type'] == 'Language Test'
        )
        self.assertEqual(language_test_change['old_status'], 'Not Started')
        self.assertEqual(language_test_change['new_status'], 'Completed')
        
        # verify background check status change
        background_check_change = next(
            change for change in result 
            if change['type'] == 'Background Verification'
        )
        self.assertEqual(background_check_change['old_status'], 'Not Started')
        self.assertEqual(background_check_change['new_status'], 'In Progress')

    def test_application_status_change(self):
        """Test application status changes"""
        new_details = self.new_details.copy()
        new_details['status'] = 'Completed'
        
        result = IRCCChecker.compare_application_details(self.old_details, new_details)
        
        self.assertTrue(result)
        self.assertEqual(len(result), 3)  # 2个活动变化 + 1个状态变化
        
        # verify application status change
        status_change = next(
            change for change in result 
            if change['type'] == 'Application Status'
        )
        self.assertEqual(status_change['old_status'], 'In Progress')
        self.assertEqual(status_change['new_status'], 'Completed')

    def test_missing_fields(self):
        """Test missing fields"""
        incomplete_details = {
            'applicationNumber': 'C000123456',
            'status': 'In Progress'
        }
        
        with self.assertRaises(KeyError):
            compare_application_details(incomplete_details, self.new_details)

    def test_different_application_numbers(self):
        """Test different application numbers"""
        different_details = self.new_details.copy()
        different_details['applicationNumber'] = 'C000654321'
        
        with self.assertRaises(ValueError):
            compare_application_details(self.old_details, different_details)

    def test_activity_order_changes(self):
        """Test activity order changes"""
        reordered_details = self.new_details.copy()
        reordered_details['activities'] = [
            {
                'type': 'Background Verification',
                'status': 'In Progress',
                'order': 1
            },
            {
                'type': 'Language Test',
                'status': 'Completed',
                'order': 2
            }
        ]
        
        result = IRCCChecker.compare_application_details(self.old_details, reordered_details)
        
        self.assertTrue(result)
        # verify activity order change is recorded
        order_changes = [
            change for change in result 
            if 'order' in change
        ]
        self.assertEqual(len(order_changes), 2)

if __name__ == '__main__':
    unittest.main() 