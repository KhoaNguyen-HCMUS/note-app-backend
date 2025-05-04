# 📘 Note App – REST API Specification

> Version: `v1`  
> Base URL: `http://localhost:5000/api`  
> Auth Method: `JWT` (Bearer Token) via `Authorization` Header

---

## 🔐 Authentication

### Register a new user

- **Endpoint**: `POST /auth/register`  
- **Description**: Tạo tài khoản mới

#### Request Body:
```json
{
  "username": "exampleuser",
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Response:
`201 Created`
```json
{
  "success": true,
  "token": "jwt_token_here"
}
```

### Login

- **Endpoint**: `POST /auth/login`
- **Description**: Xác thực và nhận JWT

#### Request Body:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Response:
`200 OK`
```json
{
  "success": true,
  "token": "jwt_token_here"
}
```

## 🗒️ Notes (Ghi chú)

⚠️ Tất cả endpoint dưới đây yêu cầu Bearer Token trong header:
```
Authorization: Bearer <jwt_token>
```

### Get All Notes

- **Endpoint**: `GET /notes`
- **Description**: Lấy tất cả ghi chú của người dùng, có thể lọc theo tag.

**Query Params (optional):**
- `tag`: lọc theo tag cụ thể

#### Response:
`200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "66336d6b...",
      "title": "Tiêu đề",
      "content": "Nội dung ghi chú",
      "tags": ["react", "frontend"],
      "createdAt": "2025-05-02T...",
      "updatedAt": "2025-05-02T..."
    }
  ]
}
```

### GET `/api/notes/:id`

Lấy thông tin một ghi chú theo ID.

**Response:**
```json
{
  "_id": "note_id",
  "title": "Tiêu đề",
  "content": "Nội dung",
  "tags": ["backend", "nodejs"],
  "user": "user_id",
  "createdAt": "2025-05-02T10:00:00.000Z"
}
```


### Create a New Note

- **Endpoint**: `POST /notes`
- **Description**: Tạo ghi chú mới

#### Request Body:
```json
{
  "title": "Tiêu đề",
  "content": "Nội dung ghi chú",
  "tags": ["mongodb", "learning"]

}
```

#### Response:
`201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "66336d6b...",
    "title": "Tiêu đề",
    "content": "Nội dung ghi chú",
    "tags": ["mongodb", "learning"],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### Update a Note

- **Endpoint**: `PUT /notes/:id`
- **Description**: Cập nhật một ghi chú đã có

#### Request Body:
```json
{
  "title": "Tiêu đề mới",
  "content": "Nội dung mới",
  "tags": ["updated", "tag"]

}
```

#### Response:
`200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "66336d6b...",
    "title": "Tiêu đề mới",
    "content": "Nội dung mới",
    "tags": ["updated", "tag"],
    "updatedAt": "2025-05-02T..."
  }
}
```

### Delete a Note

- **Endpoint**: `DELETE /notes/:id`
- **Description**: Xóa một ghi chú

#### Response:
`200 OK`
```json
{
  "success": true,
  "msg": "Ghi chú đã được xóa"
}
```

## ❗ Error Handling

| Status Code | Description |
|-------------|-------------|
| 400 | Yêu cầu không hợp lệ |
| 401 | Chưa xác thực (token sai) |
| 403 | Truy cập bị từ chối |
| 404 | Không tìm thấy ghi chú |
| 500 | Lỗi hệ thống |

Example Error:
```json
{
  "success": false,
  "msg": "Token không hợp lệ"
}
```

## 🧪 Postman Test Setup

1. Tạo collection: Note App
2. Thêm request:
   - POST /auth/register
   - POST /auth/login
   - GET /notes
   - POST /notes
   - PUT /notes/:id
   - DELETE /notes/:id
3. Sử dụng Bearer Token trong tab Authorization hoặc Header:
```
Authorization: Bearer <token>
```

## ✅ Future Extension Ideas

- Thêm tags/labels cho notes
- Tìm kiếm ghi chú theo từ khóa hoặc ngày
- Thêm chế độ "đã ghim", "đã xoá tạm"
- Cho phép upload hình ảnh trong ghi chú