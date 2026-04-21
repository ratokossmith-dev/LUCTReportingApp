import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import * as XLSX from "xlsx";

export const exportToExcel = async (data, filename, sheetName) => {
  if (!data || data.length === 0) {
    Alert.alert("No Data", "There is no data to export.");
    return;
  }

  try {
    console.log("Starting export...", data.length, "records");

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    ws["!cols"] = Object.keys(data[0]).map(() => ({ wch: 20 }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate Excel file as base64
    const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

    // Create the file using new File API
    const cacheDir = new Directory(Paths.cache);
    const file = new File(cacheDir, `${filename}.xlsx`);

    // Write the base64 content to the file
    file.write(wbout);

    console.log("File saved successfully at:", file.uri);

    // Check if file exists
    if (!file.exists) {
      throw new Error("File was not created successfully");
    }

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: `Export ${filename}`,
        UTI: "com.microsoft.excel.xlsx",
      });
    } else {
      Alert.alert(
        "Share Unavailable",
        "Sharing is not available on this device",
      );
    }

    console.log("Share completed");
  } catch (error) {
    console.log("Export error details:", error);
    Alert.alert(
      "Export Failed",
      `Error: ${error.message || "Unknown error"}\n\nPlease try again.`,
    );
  }
};

// Alternative: Save without sharing (just save to device)
export const saveExcelToDevice = async (data, filename, sheetName) => {
  if (!data || data.length === 0) {
    Alert.alert("No Data", "There is no data to export.");
    return;
  }

  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

    const cacheDir = new Directory(Paths.cache);
    const file = new File(cacheDir, `${filename}.xlsx`);
    file.write(wbout);

    Alert.alert(
      "Export Successful ✅",
      `File saved to:\n${file.uri}\n\nYou can find it in your device's file manager.`,
      [{ text: "OK" }],
    );
  } catch (error) {
    console.log("Save error:", error);
    Alert.alert("Export Failed", error.message);
  }
};

export const formatReportsForExcel = (reports) => {
  if (!reports || reports.length === 0) return [];

  return reports.map((report) => ({
    "Lecturer Name": report.lecturerName || "N/A",
    "Class Name": report.className || "N/A",
    "Course Code": report.courseCode || "N/A",
    "Course Name": report.courseName || "N/A",
    Week: report.weekOfReporting || "N/A",
    Date: report.dateOfLecture || "N/A",
    "Topic Taught": report.topicTaught || "N/A",
    "Students Present": report.actualStudentsPresent || 0,
    "Total Students": report.totalRegisteredStudents || 0,
    "Attendance Rate": report.totalRegisteredStudents
      ? `${Math.round((report.actualStudentsPresent / report.totalRegisteredStudents) * 100)}%`
      : "N/A",
    Venue: report.venue || "N/A",
    Time: report.scheduledTime || "N/A",
    Status: report.status || "Pending",
    "PRL Feedback": report.prlFeedback || "N/A",
  }));
};

export const formatAttendanceForExcel = (attendance) => {
  if (!attendance || attendance.length === 0) return [];

  return attendance.map((record) => ({
    "Student Name": record.studentName || "N/A",
    "Student Email": record.studentEmail || "N/A",
    "Class Name": record.className || "N/A",
    "Course Name": record.courseName || "N/A",
    Date: record.date || "N/A",
    Status: record.present ? "Present" : "Absent",
    Lecturer: record.lecturerName || "N/A",
  }));
};

export const formatRatingsForExcel = (ratings) => {
  if (!ratings || ratings.length === 0) return [];

  return ratings.map((rating) => ({
    "Student Name": rating.studentName || "N/A",
    "Student Email": rating.studentEmail || "N/A",
    "Lecturer Name": rating.lecturerName || "N/A",
    Rating: rating.rating || 0,
    Comment: rating.comment || "No comment",
    Course: rating.course || "N/A",
  }));
};
