import React, { useState, useEffect } from 'react';
import { Download, Filter, Search } from 'lucide-react';
import './Students.css';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/api/orientation`);
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
        } else {
          setError('Failed to fetch students data.');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Get unique branches for the filter dropdown
  const uniqueBranches = ['All', ...new Set(students.map(s => s.branch))];

  // Filter students by branch and search query
  const filteredStudents = students.filter(student => {
    const matchesBranch = filterBranch === 'All' || student.branch === filterBranch;
    const matchesSearch = student.rNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterBranch, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  const handleDownload = () => {
    if (filteredStudents.length === 0) return;

    const headers = ["R.No", "Name", "Location", "Branch", "Phone", "Attendance", "Date Submitted"];
    const csvRows = [];
    csvRows.push(headers.join(','));

    filteredStudents.forEach(student => {
      const row = [
        student.rNo,
        `"${student.name}"`, // Quote strings to handle commas in names/locations
        `"${student.location}"`,
        student.branch,
        student.phone,
        student.attendanceCount,
        new Date(student.createdAt).toLocaleDateString()
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_orientations_${filterBranch.toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="students-loading">
        <div className="loading-spinner"></div>
        <p>Loading student data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="students-error glass-card">
        <h3>Oops!</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="students-page">
      <div className="students-header">
        <div>
          <h1>Students List</h1>
          <p>View and manage orientation attendance</p>
        </div>
        <button className="download-btn" onClick={handleDownload} disabled={filteredStudents.length === 0}>
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="controls-bar glass-card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Roll No or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-box">
          <Filter size={18} className="filter-icon" />
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
          >
            {uniqueBranches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container glass-card">
        <table className="students-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Roll No</th>
              <th>Name</th>
              <th>Branch</th>
              <th>Location</th>
              <th>Phone</th>
              <th>Attended</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((student, index) => (
                <tr key={student._id}>
                  <td>{startIndex + index + 1}</td>
                  <td className="fw-600">{student.rNo}</td>
                  <td>{student.name}</td>
                  <td>
                    <span className="branch-badge">{student.branch}</span>
                  </td>
                  <td>{student.location}</td>
                  <td>{student.phone}</td>
                  <td>{student.attendanceCount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-results">
                  No students found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {filteredStudents.length > 0 && (
          <div className="pagination-controls">
            <div className="pagination-info">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStudents.length)} of {filteredStudents.length} entries
            </div>
            <div className="pagination-buttons">
              <button
                className="page-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button
                className="page-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;
