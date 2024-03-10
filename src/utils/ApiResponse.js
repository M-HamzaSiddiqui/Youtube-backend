class ApiResponse {
    constructor(
        statusCode,
        data,
        message = "Success"
    ) {
        this.statusCode = statusCode;
        this.data = data;         // it contains addtional information about the error that helps in debugging
        this.message = message;
        this.success = statusCode < 400;
    }
}

export { ApiResponse };