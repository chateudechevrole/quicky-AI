# QuickTutor - Website Description

## Overview

**QuickTutor** is an instant, on-demand tutoring platform that connects students with qualified tutors in real-time. Think of it as "Grab but for tutors" - no scheduling needed, students can get immediate help from tutors who are currently online.

---

## Core Concept

The platform enables **instant tutoring sessions** where:
- Students can find and connect with available tutors immediately
- Tutors can toggle online/offline status and accept booking requests on-the-fly
- Classes start instantly with real-time chat communication
- All sessions are tracked, timed, and automatically processed

---

## Three User Roles

### 1. **Students** (Blue Theme)
Students seeking immediate academic help can:
- Browse available online tutors
- Filter tutors by subject, grade level, and preferred language
- Book tutors instantly with flexible 15-minute duration intervals
- Communicate in real-time during classes
- Rate tutors after sessions with behavior tags
- View booking history and manage their profile
- Request to end class early (with tutor approval)

### 2. **Tutors** (Green Theme)
Qualified educators who want to teach can:
- Complete profile setup with subjects, grades, and languages they teach
- Set hourly rates in RM (Malaysian Ringgit)
- Upload verification documents (IC, education certificates, bank statements)
- Toggle online/offline status
- Accept or reject booking requests from students
- Start and manage classes with built-in timer
- Communicate with students via real-time chat
- Rate students after sessions
- Track earnings, completed classes, and booking history
- View dashboard statistics

### 3. **Admins** (Orange Theme)
Platform administrators can:
- Review and approve/reject tutor applications
- View uploaded verification documents
- Monitor platform statistics (total users, students, tutors, classes completed)
- View revenue breakdown (tutor earnings vs platform fees)
- Manage all bookings with filtering by month
- Handle student reports about tutors
- Access comprehensive user and booking management

---

## Key Features & Modules

### 1. **Authentication & User Management**
- Role-based authentication system (Student, Tutor, Admin)
- Secure login portals for each role
- Profile creation with role-specific onboarding
- Profile picture uploads for students and tutors
- Avatar display in navigation bars

### 2. **Tutor Verification System**
- New tutors must complete profile setup first
- Document upload required:
  - Identification Card (IC)
  - Highest Education Certificate
  - Bank Statement
- Admin review and approval process
- Tutors cannot access dashboard until approved
- Verification status tracking (pending, approved, rejected)

### 3. **Student Dashboard & Tutor Discovery**
- Real-time list of available online tutors
- Advanced filtering system:
  - Grade Level dropdown
  - Subject dropdown (limited to tutor's offerings)
  - Preferred Language dropdown (limited to tutor's offerings)
- Tutors automatically hidden when:
  - Currently in a session
  - Have pending/active bookings
  - Not verified by admin
- Tutor cards showing:
  - Name and profile picture
  - Subjects, grades, and languages
  - Rating and hourly rate (RM)
  - Online status

### 4. **Booking System**
- Instant booking requests (no scheduling)
- Students select:
  - Subject (from tutor's available subjects)
  - Grade level (from tutor's available grades)
  - Language (from tutor's available languages)
  - Duration (15-minute intervals: 15, 30, 45, 60, 75, 90 minutes)
- Automatic cost calculation:
  - Total amount = hourly rate × duration
  - 10% platform fee
  - Tutor earnings = total - platform fee
- Booking flow:
  1. Student requests → Status: "pending"
  2. Tutor accepts/rejects → Status: "accepted" or "rejected"
  3. Tutor starts class → Status: "in_progress"
  4. Class ends → Status: "completed"

### 5. **Classroom & Real-Time Communication**
- Real-time chat interface using Supabase Realtime
- Session timer showing time remaining
- Class controls:
  - Only tutors can start classes
  - Only tutors can end classes (when timer expires or student's early end request is approved)
  - Students can request early end (requires tutor approval)
- Timer automatically tracks session duration
- Session status displayed on tutor dashboard when in progress

### 6. **Rating & Review System**
- **Student → Tutor Ratings:**
  - Star rating (1-5 stars)
  - Behavior tags (dynamic based on rating):
    - 5 stars: Positive behaviors (e.g., "Patient", "Clear explanations", "Engaging")
    - 4 stars or below: Improvement areas (e.g., "Needs better communication", "Time management")
  - Written reviews
  - One rating per booking (cannot rate twice)
  
- **Tutor → Student Ratings:**
  - Star rating
  - Behavior/manner tags (positive or improvement areas)
  - One rating per booking

- **Display:**
  - Ratings shown on tutor profiles
  - Behavior tags displayed as badges under reviews
  - Average ratings and total count tracked

### 7. **Reporting System**
- Students can report tutors:
  - During active classes (in classroom chat)
  - After class completion (in booking history)
- Report includes:
  - Reason (dropdown selection)
  - Additional comments (textarea)
  - Optional file attachments
- Admin can:
  - View all reports
  - Update report status (open, in_review, resolved, dismissed)
  - Add admin notes
  - View report details and attachments

### 8. **Notifications System**
- Real-time notifications for:
  - Booking requests
  - Booking acceptance/rejection
  - Class start/end
  - Report updates
- Unread notification counts displayed

### 9. **Admin Dashboard**
- **Overview Statistics:**
  - Total Users (all roles)
  - Total Students
  - Total Tutors
  - Classes Completed This Month

- **Revenue Breakdown:**
  - Total Tutor Earnings (RM)
  - Total Platform Income (RM)
  - Total Gross Revenue (RM)

- **Management Features:**
  - Tutor application review
  - Booking history with month filtering
  - Report management
  - User management
  - Booking details with creation and end timestamps

### 10. **Booking Management**
- **Students:**
  - View all bookings (past and upcoming)
  - See booking status and details
  - Access completed class reviews
  - Request early end during sessions

- **Tutors:**
  - View pending booking requests
  - Accept/reject bookings
  - Access booking details
  - View completed classes and earnings

- **Admin:**
  - View all bookings across platform
  - Filter by month (last 12 months or all time)
  - See creation and end timestamps
  - Monitor booking statuses

### 11. **Profile Management**
- Students can:
  - Update personal information
  - Set preferred subjects and languages
  - Upload profile picture
  - View booking history

- Tutors can:
  - Update bio, subjects, grades, languages
  - Set hourly rate (RM)
  - Upload profile picture
  - View verification status
  - Update documents if needed

---

## Technical Features

### **Security & Access Control**
- Row Level Security (RLS) policies on all database tables
- Role-based access control throughout the application
- Secure file uploads with Supabase Storage
- Protected routes with authentication middleware

### **Real-Time Features**
- Real-time chat messages via Supabase Realtime subscriptions
- Live booking status updates
- Instant notification delivery
- Dynamic online/offline status

### **User Experience**
- Role-specific color themes (Student: Blue, Tutor: Green, Admin: Orange)
- Responsive design for mobile and desktop
- Profile pictures displayed throughout the platform
- Intuitive navigation with role-specific menus
- Automatic tutor availability management (hides busy tutors)

### **Data Integrity**
- One-time rating enforcement (database constraints + UI checks)
- Unique booking IDs and timestamps
- Automatic status updates and tracking
- Session timer accuracy with automatic expiration handling

---

## Currency & Localization

- All prices and earnings displayed in **RM (Malaysian Ringgit)**
- Currency symbol consistently used across the platform
- Localized grade levels (Standard 1-6, Form 1-5)
- Malaysian subjects (Bahasa Melayu, Sejarah, etc.)

---

## Technology Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL Database, Authentication, Storage, Realtime)
- **Security:** Row Level Security (RLS), Role-based access control
- **Deployment:** Server-side rendering with Next.js

---

## Unique Selling Points

1. **Instant Matching:** No scheduling delays - connect students and tutors immediately
2. **Quality Assurance:** Rigorous tutor verification process ensures qualified educators
3. **Flexible Sessions:** 15-minute intervals allow students to book exactly what they need
4. **Real-Time Communication:** Live chat during classes for immediate feedback
5. **Comprehensive Rating System:** Behavior tags provide detailed feedback beyond stars
6. **Safety Features:** Reporting system allows students to flag issues
7. **Fair Payment:** Automatic fee calculation with transparent tutor earnings
8. **Admin Oversight:** Complete platform management and monitoring tools

---

## User Flow Summary

**Student Journey:**
1. Sign up → Complete profile → Browse available tutors
2. Filter by preferences → View tutor profile → Book session
3. Wait for tutor acceptance → Enter classroom when class starts
4. Chat and learn → Rate tutor after completion

**Tutor Journey:**
1. Sign up → Complete profile → Upload verification documents
2. Wait for admin approval → Set online status
3. Receive booking requests → Accept/reject → Start class
4. Teach via chat → End class when timer expires → Rate student

**Admin Journey:**
1. Login → Review tutor applications → Approve/reject
2. Monitor platform statistics → View bookings and revenue
3. Handle reports → Manage users and resolve issues

---

This platform revolutionizes online tutoring by eliminating scheduling friction and providing instant access to qualified tutors, making education more accessible and convenient for students while offering flexible earning opportunities for educators.





