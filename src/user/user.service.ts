import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

interface UpdateProfile {
  fullname?: string;
  avatarUrl?: string;
}

@Injectable()
export class UserService {
  public constructor(private readonly prisma: PrismaService) {}

  /**
   * Updates a user's profile information.
   *
   * @param userId - The ID of the user to be updated.
   * @param fullname - The new full name of the user (optional).
   * @param avatarUrl - The new avatar URL for the user (optional).
   * @returns The updated user profile.
   * @throws {Error} When no data is provided for the update or if
   * the update operation fails.
   */
  async updateProfile(userId: number, fullname?: string, avatarUrl?: string) {
    const updateData: UpdateProfile = {
      fullname: '',
      avatarUrl: '',
    };
    if (avatarUrl) updateData.avatarUrl = avatarUrl;
    if (fullname) updateData.fullname = fullname;
    // If both data are not provided, throw an error
    if (!avatarUrl && !fullname) throw new Error('No data provided for update');
    try {
      // Update the user's profile & return user object
      return await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    } catch (error) {
      throw new Error("Failed to update the user's profile");
    }
  }
}
