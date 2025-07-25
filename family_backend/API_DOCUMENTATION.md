# Family Connections API Documentation

Base URL: `/`

---

## Endpoints

### 1. Get All Users
**GET** `/users`  
Returns a list of all users.

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  ...
]
```

---

### 2. Create Relationship
**POST** `/connect`  
Creates a relationship between two users.

**Request Body:**
```json
{
  "from_user_id": 1,
  "to_user_id": 2,
  "relationship_type": "father"
}
```

**Response:**
```json
{ "message": "Relationship added!" }
```

---

### 3. Update Relationship
**POST** `/update_relationship/<relationship_id>`  
Updates the relationship type for a given relationship.

**Request Body:**
```json
{ "relationship_type": "mother" }
```

**Response:**
```json
{ "message": "Relationship updated" }
```

---

### 4. Delete Relationship
**DELETE** `/delete_relationship/<relationship_id>`  
Deletes a relationship by its ID.

**Response:**
```json
{ "message": "Relationship deleted" }
```

---

### 5. Update User Profile
**POST** `/update_profile/<user_id>`  
Updates a user's profile information.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "profile_pic": "url_to_pic"
}
```

**Response:**
```json
{ "message": "Profile updated successfully." }
```

---

### 6. Get Relationships for a User
**GET** `/relationships/<user_id>`  
Returns all relationships for a given user.

**Response:**
```json
[
  {
    "relative_id": 2,
    "name": "Jane Doe",
    "relationship": "mother"
  },
  ...
]
```

---

### 7. Get Family Tree
**GET** `/tree/<user_id>`  
Returns the family tree for a user, recursively including all relations.

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "relations": [
    {
      "id": 2,
      "name": "Jane Doe",
      "relationship": "mother",
      "relations": [ ... ]
    }
  ]
}
```

---

### 8. Delete User
**DELETE** `/delete_user/<user_id>`  
Deletes a user and all their relationships.

**Response:**
```json
{ "message": "User with ID 1 deleted." }
```

---
