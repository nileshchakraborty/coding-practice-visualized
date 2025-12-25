# API Reference

Complete REST API documentation for the Codenium backend.

---

## Base URL

| Environment | URL |
|-------------|-----|
| Local Development | `http://localhost:3001` |
| Production (Vercel) | `https://codenium.vercel.app` |

---

## Authentication

Protected endpoints require a Google OAuth ID token in the Authorization header:

```http
Authorization: Bearer <google-id-token>
```

### Obtaining a Token

1. User authenticates via Google OAuth on the frontend
2. Frontend receives ID token from Google
3. Token is passed in API requests

---

## Rate Limiting

| Category | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 1 minute |
| AI Endpoints | 10 requests | 1 minute |

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703289600
```

---

## Endpoints

### Health Check

#### `GET /api/health`

Check API server status.

**Response:**
```json
{
    "status": "healthy",
    "architecture": "hexagonal",
    "check": "vercel-native"
}
```

---

### Problems

#### `GET /api/problems`

Get all problems with metadata.

**Response:**
```json
[
    {
        "slug": "two-sum",
        "title": "Two Sum",
        "difficulty": "Easy",
        "pattern": "Hash Table",
        "topics": ["Array", "Hash Table"],
        "companies": ["Amazon", "Google", "Meta"]
    }
]
```

**Caching:** Results are cached for 5 minutes.

---

### Recommendations

#### `GET /api/recommendations`

Get hot topics and popular problems based on user activity.

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `k` | number | 10 | Number of hot problems to return |
| `topicK` | number | 5 | Number of hot topics to return |

**Response:**
```json
{
    "hotProblems": [
        {
            "slug": "two-sum",
            "score": 245.5,
            "views": 150,
            "solves": 45
        }
    ],
    "hotTopics": [
        {
            "category": "Array / String",
            "engagement": 340,
            "problemCount": 5
        }
    ],
    "stats": {
        "problems": 10,
        "categories": 6
    }
}
```

**Notes:**
- Scores are calculated with time-decay (recent activity weighted higher)
- Data persists across server restarts
- Views are tracked when solution pages are accessed

---

#### `GET /api/solution/:slug`

Get full solution data for a problem.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `slug` | string | Problem URL slug (e.g., "two-sum") |

**Response:**
```json
{
    "slug": "two-sum",
    "title": "Two Sum",
    "difficulty": "Easy",
    "description": "Given an array of integers...",
    "examples": [
        {
            "input": "nums = [2,7,11,15], target = 9",
            "output": "[0,1]",
            "explanation": "Because nums[0] + nums[1] == 9"
        }
    ],
    "code": "class Solution:\n    def twoSum(self, nums, target)...",
    "bruteForce": "...",
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(n)",
    "intuition": "Use a hash map to store complements...",
    "mentalModel": "Think of it like a coat check...",
    "hints": ["Consider using a hash map", "..."],
    "animationData": {...},
    "videoId": "KLlXCFG5TnA"
}
```

---

### Code Execution

#### `POST /api/execute`

Execute code against test cases.

**Authentication:** Required

**Request Body:**
```json
{
    "code": "class Solution:\n    def twoSum(self, nums, target):\n        ...",
    "testCases": [
        {"input": "[2,7,11,15], 9", "output": "[0,1]"}
    ],
    "language": "python",
    "referenceCode": "...",
    "constraints": ["1 <= nums.length <= 10^4"]
}
```

**Response (Success):**
```json
{
    "success": true,
    "results": [
        {
            "passed": true,
            "input": "[2,7,11,15], 9",
            "expected": "[0,1]",
            "actual": "[0,1]",
            "runtime": 12
        }
    ],
    "totalPassed": 1,
    "totalTests": 1
}
```

**Response (Error):**
```json
{
    "success": false,
    "error": "SyntaxError: invalid syntax",
    "results": []
}
```

---

### AI Tutor

#### `POST /api/tutor`

Chat with the AI tutor about a problem.

**Authentication:** Required

**Request Body:**
```json
{
    "slug": "two-sum",
    "message": "I don't understand why we need a hash map here",
    "history": [
        {"role": "user", "content": "How do I solve this?"},
        {"role": "assistant", "content": "Let me guide you..."}
    ],
    "code": "class Solution:\n    def twoSum..."
}
```

**Response:**
```json
{
    "response": "Great question! The hash map helps us achieve O(n) time complexity...",
    "role": "assistant"
}
```

---

#### `POST /api/generate`

Generate a complete AI solution for a problem.

**Authentication:** Required

**Request Body:**
```json
{
    "slug": "two-sum"
}
```

**Response:**
```json
{
    "success": true,
    "solution": {
        "code": "class Solution:\n    def twoSum...",
        "timeComplexity": "O(n)",
        "spaceComplexity": "O(n)",
        "explanation": "We use a hash map to store..."
    }
}
```

---

### Background Jobs

#### `POST /api/jobs`

Submit a background job for long-running AI operations.

**Authentication:** Required

**Request Body:**
```json
{
    "type": "ai_explain",
    "payload": {
        "code": "...",
        "title": "Two Sum"
    }
}
```

**Job Types:**
| Type | Description |
|------|-------------|
| `ai_explain` | Generate detailed code explanation |
| `generate` | Generate complete solution |

**Response:**
```json
{
    "jobId": "job_abc123",
    "status": "pending"
}
```

---

#### `GET /api/jobs/:jobId`

Get job status and result.

**Authentication:** Required

**Response (Pending):**
```json
{
    "jobId": "job_abc123",
    "status": "pending",
    "progress": 50
}
```

**Response (Complete):**
```json
{
    "jobId": "job_abc123",
    "status": "completed",
    "result": {...}
}
```

---

### User Progress

#### `GET /api/progress`

Get authenticated user's progress.

**Authentication:** Required

**Response:**
```json
{
    "userId": "google-oauth-id",
    "solvedProblems": ["two-sum", "valid-parentheses"],
    "attemptedProblems": ["3sum"],
    "lastUpdated": 1703289600000
}
```

---

#### `POST /api/progress`

Save user progress.

**Authentication:** Required

**Request Body:**
```json
{
    "solvedProblems": ["two-sum", "valid-parentheses"],
    "attemptedProblems": ["3sum"]
}
```

**Response:**
```json
{
    "success": true,
    "lastSyncedAt": 1703289600000
}
```

---

#### `POST /api/progress/sync`

Bidirectional sync of progress (merges local and server state).

**Authentication:** Required

**Request Body:**
```json
{
    "localProgress": {
        "solvedProblems": ["two-sum"],
        "attemptedProblems": [],
        "lastUpdated": 1703289500000
    }
}
```

**Response:**
```json
{
    "mergedProgress": {
        "solvedProblems": ["two-sum", "valid-parentheses"],
        "attemptedProblems": ["3sum"],
        "lastUpdated": 1703289600000
    },
    "syncedAt": 1703289600000
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
    "error": "Error message describing what went wrong"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Related Documentation

- [Backend Guide](./Backend-Guide.md) - Server implementation
- [Authentication](./Authentication.md) - OAuth setup
- [Rate Limiting](./Rate-Limiting.md) - Rate limit configuration
