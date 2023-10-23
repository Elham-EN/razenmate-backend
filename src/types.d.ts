/**
 * Change the shape of the Request Object,
 * it can have a username and a sub
 */
declare namespace Express {
  export interface Request {
    user?: {
      username: string;
      sub: number;
    };
  }
}
