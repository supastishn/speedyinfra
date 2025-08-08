# SpeedyInfra

SpeedyInfra is a comprehensive backend service designed for modern applications, providing a fast and flexible foundation for your projects. It features a powerful REST API for managing data tables, user authentication, and file storage. The project includes a full-featured React example application that demonstrates how to integrate with the backend and provides offline capabilities.

## Features

- **Generic Table API**: Dynamically create and manage data tables with full CRUD (Create, Read, Update, Delete) operations. Supports querying, pagination, sorting, and filtering.
- **Authentication**: Secure user registration and login with JWT-based authentication. Includes role-based access control.
- **File Storage**: Upload, download, list, and delete files associated with your project.
- **Project-Based Scoping**: All resources (tables, users, files) are scoped to a project, identified by an `X-Project-Name` header.
- **Embedded Database**: Uses NeDB, a lightweight file-based database, for easy setup and portability.
- **API Documentation**: Includes Swagger/OpenAPI documentation for all endpoints, accessible at `/api-docs`.
- **React Example App**: A complete React application showcasing all backend features, with offline support using IndexedDB.

## Getting Started

### Prerequisites

- Node.js (v20 or later recommended)
- npm

### Installation

1.  Clone the repository.

2.  Install backend dependencies from the root directory:
    ```sh
    npm install
    ```

3.  Install frontend dependencies for the React example:
    ```sh
    npm install --prefix examples/react
    ```

## Running the Application

### Backend Server

To start the backend Express server, run the following command from the root directory. The server will run on `http://localhost:3000` by default.

```sh
npm start
```

This uses `nodemon` to automatically restart the server on file changes.

### React Example App

To run the React development server:

```sh
npm run dev --prefix examples/react
```

The React app will be available at `http://localhost:5173` and will proxy API requests to the backend server.

## Running Tests

### Backend Tests

To run the Jest tests for the backend API, use:

```sh
npm test
```

### Frontend Tests

To run the Vitest tests for the React application, use:

```sh
npm test --prefix examples/react
```

## API Documentation

Once the backend server is running, you can access the interactive Swagger UI for API documentation at:

[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

All API requests must include the `X-Project-Name` header to specify which project's data you are accessing. For protected routes, an `Authorization: Bearer <token>` header is also required.

## Project Structure

- `app.js`: The main Express application entry point.
- `routes/`: Contains the API route definitions.
- `util/`: Utility functions for database connections, authentication, etc.
- `projects/`: Directory where project-specific data (databases, uploads) is stored. This is git-ignored.
- `tests/`: Backend Jest tests.
- `examples/react/`: The React frontend example application.
- `eslint.config.js`, `.prettierrc`: Linting and formatting configurations.
