import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { Alert, Platform } from 'react-native';

export const exportToExcel = async (data, filename, sheetName) => {
  if (!data || data.length === 0) {
    Alert.alert('No Data', 'There is no data to export.');
    return;
  }

  try {
    console.log('Starting export...', data.length, 'records');
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    
    if (Platform.OS === 'web') {
      const blob = new Blob([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], 
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      Alert.alert('Export Successful', 'File downloaded successfully.');
    } else {
      const fileUri = FileSystem.documentDirectory + `${filename}.xlsx`;
      await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: 'base64' });
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: `Export ${filename}`,
      });
    }
  } catch (error) {
    console.log('Export error details:', error);
    Alert.alert('Export Failed', error.message || 'Unknown error');
  }
};

export const formatReportsForExcel = (reports) => {
  if (!reports || reports.length === 0) return [];
  
  return reports.map(report => ({
    'Lecturer Name': report.lecturerName || 'N/A',
    'Class Name': report.className || 'N/A',
    'Course Code': report.courseCode || 'N/A',
    'Course Name': report.courseName || 'N/A',
    'Week': report.weekOfReporting || 'N/A',
    'Date': report.dateOfLecture || 'N/A',
    'Topic Taught': report.topicTaught || 'N/A',
    'Students Present': report.actualStudentsPresent || 0,
    'Total Students': report.totalRegisteredStudents || 0,
    'Attendance Rate': report.totalRegisteredStudents ? 
      `${Math.round((report.actualStudentsPresent / report.totalRegisteredStudents) * 100)}%` : 'N/A',
    'Venue': report.venue || 'N/A',
    'Time': report.scheduledTime || 'N/A',
    'Status': report.status || 'Pending',
    'PRL Feedback': report.prlFeedback || 'N/A'
  }));
};

export const formatAttendanceForExcel = (attendance) => {
  if (!attendance || attendance.length === 0) return [];
  
  return attendance.map(record => ({
    'Student Name': record.studentName || 'N/A',
    'Student Email': record.studentEmail || 'N/A',
    'Class Name': record.className || 'N/A',
    'Course Name': record.courseName || 'N/A',
    'Date': record.date || 'N/A',
    'Status': record.present ? 'Present' : 'Absent',
    'Lecturer': record.lecturerName || 'N/A'
  }));
};

export const formatRatingsForExcel = (ratings) => {
  if (!ratings || ratings.length === 0) return [];
  
  return ratings.map(rating => ({
    'Student Name': rating.studentName || 'N/A',
    'Student Email': rating.studentEmail || 'N/A',
    'Lecturer Name': rating.lecturerName || 'N/A',
    'Rating': rating.rating || 0,
    'Comment': rating.comment || 'No comment',
    'Course': rating.course || 'N/A'
  }));
};