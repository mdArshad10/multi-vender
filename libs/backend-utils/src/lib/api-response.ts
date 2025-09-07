class ApiResponse {
  public readonly statusCode: number;
  public readonly data?: any;
  public readonly message: string;
  public readonly success: boolean;

  constructor(statusCode: number, message = 'Success', data?: any) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
