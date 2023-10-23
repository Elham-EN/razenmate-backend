import { Args, Resolver, Mutation, Context } from '@nestjs/graphql';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from './user.service';
import { UseGuards } from '@nestjs/common';
import { GraphqlAuthGuard } from 'src/auth/graphql-auth.guard';
import { User } from './user.type';
import { Request } from 'express';
import { join } from 'path';
import { createWriteStream } from 'fs';

@Resolver()
export class UserResolver {
  public constructor(private readonly userService: UserService) {}

  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => User)
  public async updateProfile(
    @Args('fullname') fullname: string,
    @Args('file', { type: () => GraphQLUpload, nullable: true })
    file: GraphQLUpload.FileUpload,
    @Context() context: { req: Request },
  ) {
    const imageUrl = file ? await this.storeImageAndGetUrl(file) : null;
    const userId = context.req.user.sub;
    return this.userService.updateProfile(userId, fullname, imageUrl);
  }

  /**
   * This is a helper method used to handle the uploaded file
   * It store the image to the server's filesystem and returns the URL
   * * Later can save it to cloud storage instead of local filesystem
   */
  private async storeImageAndGetUrl(file: GraphQLUpload.FileUpload) {
    const { createReadStream, filename } = file;
    const uniqueFilename = `${uuidv4()}/${filename}`;
    const imagePath = join(process.cwd(), 'public', uniqueFilename);
    const imageUrl = `${process.env.APP_URL}/${uniqueFilename}`;
    const readStream = createReadStream();
    readStream.pipe(createWriteStream(imagePath));
    return imageUrl;
  }
}
