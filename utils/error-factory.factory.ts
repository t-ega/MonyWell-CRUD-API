// This module represents the factory method for creating error objects.
// It is used to create error objects that are returned to the client when an error occurs with validation.

class ErrorFactory {
    /**
     * Factory method to create an error object
     * @param err | any
     * @returns statusCode and message
     */

    static getError(err: any) {
      const success = false;
      let details = err;
  
      // Check if the error has a specific message
      if (err?.message) {
        details = err.message;
      }
  
      return {
        success,
        details
      };
    }
}

export default ErrorFactory;
  