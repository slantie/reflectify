# Reflectify - Anonymous Academic Feedback System

Reflectify is a secure and scalable platform designed to help educational institutions collect and analyze anonymous student feedback. It empowers institutions with real-time insights to improve faculty performance, course effectiveness, and overall academic quality.

## 🚀 Why Reflectify?

Traditional feedback systems often lack anonymity, leading to biased or inaccurate responses. Reflectify ensures complete student privacy while providing institutions with actionable insights through a seamless and intuitive interface.

## 🌟 Key Features

### 🔒 Anonymous Feedback Collection

- Protects student identity with encrypted responses
- Enforces one-time submissions per student to maintain integrity
- Secure handling to ensure anonymity at all levels

### 🏫 Academic Structure Management

- Supports academic hierarchy: **Department → Semester → Division**
- Faculty and subject mapping with teaching assignments
- Handles **core subjects, electives, labs, and tutorials**
- Feedback is structured around faculty-time slots for accuracy

### 📑 Customizable Feedback Forms

- Dynamic form templates tailored to each division
- Supports **custom question categories**
- Required/optional field customization
- Logical sequencing for structured feedback flow

### 📊 Real-time Analytics & Reports

- **Faculty performance tracking** based on student feedback
- **Department-wise analytics** for comparative analysis
- **Trend monitoring** to track semester-wise progress
- **Exportable reports** for institutional records

### 🔐 Security & Compliance

- **End-to-end encryption** to protect feedback data
- **Role-based access control (RBAC)** for administrators, faculty, and students
- **Audit logging** to track system activity
- **Rate limiting** to prevent spam or misuse

## 🏗️ Built for Scalability

- Handles **large-scale institutions** with thousands of students
- **High-availability architecture** for uninterrupted access
- **Optimized caching** for fast data retrieval

## 🎯 Who Can Use Reflectify?

Reflectify is designed for:

- **Educational Institutions** looking to enhance academic quality
- **Faculty Administrators** managing faculty feedback
- **Department Heads** monitoring subject-wise performance
- **Academic Coordinators** tracking semester-wise trends
- **Students** who want a secure way to share honest feedback

## 📜 License

Reflectify is open-source under the **MIT License**.

## 📬 Contact & Support

For any issues or suggestions, please reach out via [GitHub Issues](https://github.com/your-repo/reflectify/issues).

---

Made with ❤️ for better academic feedback!

<!--
## 1. Database Table Relationships & Logic


![Architecture](https://github.com/user-attachments/assets/39f96273-e109-409d-8032-2128dbd73956)

### Core Entity Relationships

#### Academic Structure Flow
- Department → Semester → Division
  - Each department contains multiple semesters (1,3,5,7)
  - Each semester contains multiple divisions
  - This hierarchy enforces proper data organization and access control

#### Faculty and Teaching Assignments
- Department → Faculty → TimeSlot
  - Faculties belong to departments
  - Faculty teaching assignments are tracked through TimeSlot entries
  - Enables tracking which faculty teaches what subject in which division

#### Curriculum Management
- Semester → Subject → SubjectType
  - Subjects are assigned to specific semesters
  - SubjectType differentiates between lectures and labs
  - Handles elective subjects through the is_elective flag

#### Feedback System Flow
- TimeSlot → FeedbackForm → FeedbackResponse → ResponseDetail
  - FeedbackForms are generated based on TimeTable entries
  - Each form is linked to specific faculty-subject-division combination
  - Responses are anonymously collected and stored

### Key Foreign Key Relationships

1. Division → Semester:
   - Ensures divisions belong to correct semester
   - Maintains academic hierarchy

2. TimeSlot → Faculty, Subject:
   - Links teaching assignments
   - Handles both lecture and lab sessions
   - Manages combined classes for electives

3. FeedbackForm → Division, Faculty, Subject:
   - Creates unique feedback forms
   - Maintains relationships for analytics
   - Enables targeted feedback collection

## 2. Dynamic Feedback Form Management

### Form Template System

```sql
CREATE TABLE FormTemplate (
    template_id INT PRIMARY KEY,
    division_id INT,
    name VARCHAR(100),
    is_active BOOLEAN,
    FOREIGN KEY (division_id) REFERENCES Division(division_id)
);

CREATE TABLE TemplateQuestion (
    template_question_id INT PRIMARY KEY,
    template_id INT,
    question_id INT,
    sequence_number INT,
    is_required BOOLEAN,
    FOREIGN KEY (template_id) REFERENCES FormTemplate(template_id),
    FOREIGN KEY (question_id) REFERENCES Question(question_id)
);
```

### Question Categories
```sql
CREATE TABLE QuestionCategory (
    category_id INT PRIMARY KEY,
    name VARCHAR(50),
    description TEXT
);

ALTER TABLE Question
ADD COLUMN category_id INT REFERENCES QuestionCategory(category_id);
```

This structure allows:
- Different question sets per division
- Customizable form templates
- Reusable question bank
- Flexible form structure

## 3. Implementation Strategies

### A. Authentication & Authorization

1. JWT-based authentication system
```typescript
interface TokenPayload {
    userId: string;
    role: 'admin' | 'faculty' | 'student';
    department: string;
    semester?: number;
    division?: string;
}
```

2. Role-based access control:
```typescript
const permissions = {
    admin: ['manage_users', 'view_analytics', 'manage_forms'],
    faculty: ['view_own_feedback', 'view_own_analytics'],
    student: ['submit_feedback']
};
```

### B. Feedback Form Generation

1. Automated form creation based on timetable:
```typescript
async function generateFeedbackForms(semesterId: number) {
    const timetableEntries = await getTimetableEntries(semesterId);

    for (const entry of timetableEntries) {
        await createFeedbackForm({
            divisionId: entry.divisionId,
            facultyId: entry.facultyId,
            subjectId: entry.subjectId,
            template: await getFormTemplate(entry.divisionId)
        });
    }
}
```

2. Anonymous response handling:
```typescript
function generateAnonymousIdentifier(formId: string, salt: string): string {
    return crypto
        .createHash('sha256')
        .update(`${formId}${salt}${Date.now()}`)
        .digest('hex');
}
```

### C. Analytics Engine

1. Real-time analytics processing:
```typescript
interface AnalyticsProcessor {
    processResponse(response: FeedbackResponse): void;
    updateFacultyMetrics(facultyId: string): Promise<FacultyMetrics>;
    updateDivisionMetrics(divisionId: string): Promise<DivisionMetrics>;
}
```

2. Caching strategy:
```typescript
const analyticsCache = {
    faculty: new LRUCache<string, FacultyMetrics>(1000),
    division: new LRUCache<string, DivisionMetrics>(100)
};
```

### D. Scalability Features

1. Database sharding strategy:
```typescript
const shardingConfig = {
    department: {
        shardKey: 'department_code',
        shardCount: 10
    },
    feedback: {
        shardKey: 'submission_date',
        shardCount: 20
    }
};
```

2. Caching layers:
```typescript
const cachingLayers = {
    L1: {
        type: 'memory',
        ttl: '1h',
        size: '1GB'
    },
    L2: {
        type: 'redis',
        ttl: '24h',
        size: '10GB'
    }
};
```

## 4. Database Selection: PostgreSQL vs MongoDB

### Recommendation: PostgreSQL

Reasons for choosing PostgreSQL:

1. Data Integrity Requirements:
   - Strong referential integrity needed for academic data
   - ACID compliance crucial for feedback submissions
   - Complex joins required for analytics

2. Schema Advantages:
   - Well-defined structure for academic data
   - Complex relationships between entities
   - Transaction support for form submissions

3. Query Capabilities:
   - Advanced aggregation for analytics
   - Window functions for ranking and analysis
   - Full-text search for feedback comments

4. Scaling Solutions:
   - Horizontal scaling through Citus
   - Partitioning for large tables
   - Parallel query execution

### Implementation Example:

```sql
-- Partitioning for feedback responses
CREATE TABLE feedback_responses (
    response_id INT,
    form_id INT,
    submission_time TIMESTAMP,
    response_data JSONB
) PARTITION BY RANGE (submission_time);

-- Create partitions
CREATE TABLE feedback_responses_2024_q1
PARTITION OF feedback_responses
FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

-- Index for analytics
CREATE INDEX idx_feedback_faculty
ON feedback_responses
USING BTREE (form_id, submission_time)
INCLUDE (response_data);
```

## 5. Scalability & Availability Design

### A. High Availability Setup

1. Database Configuration:
```yaml
primary:
  host: primary-db
  replicas: 3
  sync_replicas: 1
  async_replicas: 2

read_replicas:
  count: 5
  distribution:
    - region: asia-south1
    - region: asia-south2
```

2. Load Balancing:
```typescript
const loadBalancer = {
    algorithm: 'least_connections',
    healthCheck: {
        interval: '5s',
        timeout: '3s',
        unhealthy_threshold: 2
    },
    ssl: {
        enabled: true,
        cert_type: 'automatic'
    }
};
```

### B. Caching Strategy

1. Multi-level caching:
```typescript
const cacheStrategy = {
    analytics: {
        type: 'redis',
        ttl: '1h',
        invalidation: 'on_write'
    },
    forms: {
        type: 'memory',
        ttl: '15m',
        invalidation: 'on_update'
    }
};
```

2. Rate Limiting:
```typescript
const rateLimits = {
    submission: {
        window: '1h',
        max: 1,
        per: 'student_form'
    },
    analytics: {
        window: '1m',
        max: 30,
        per: 'faculty'
    }
};
``` -->
