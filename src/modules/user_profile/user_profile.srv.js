const sequelize = require('../../../config/db.config');
const mdl_UserProfile = require('./user_profile.mdl');
const UserCredentials = require('../user_creds/user_creds.mdl');

class UserProfileService {
  constructor(io) {
    this.io = io;
  }

  async addProfile(payload) {
    const transaction = await sequelize.transaction();

    try {
      const creds = await UserCredentials.findByPk(payload.user_id, { transaction });
      if (!creds) throw new Error('User credentials not found');
      const profile = await mdl_UserProfile.create(payload, { transaction });

      await transaction.commit();
      this.io.emit('profile:created', profile);

      return profile;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async updateProfile(id, payload) {
    const transaction = await sequelize.transaction();

    try {
      const profile = await mdl_UserProfile.findByPk(id, { transaction });
      if (!profile) throw new Error('Profile not found');

      await profile.update(payload, { transaction });
      await transaction.commit();

      this.io.emit('profile:updated', profile);
      return profile;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async myUpdateProfile(user_id, payload) {
    const transaction = await sequelize.transaction();

    try {
      const profile = await mdl_UserProfile.findOne({
        where: { user_id },
        transaction
      });

      if (!profile) throw new Error('Profile not found');

      const updated = await profile.update(payload, { transaction });
      await transaction.commit();

      this.io.emit('profile:updated', updated);
      return updated;

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }


  async getProfile() {
    return UserCredentials.findAll({
      include: [
        {
          model: mdl_UserProfile,
        }
      ]
    });
  }

  async getProfileByID(id) {
    return mdl_UserProfile.findByPk(id);
  }

  async myProfile(user_id) {
    return UserCredentials.findOne({
      where: { user_id },
      include: [
        {
          model: mdl_UserProfile
        }
      ]
    });
  }

}

module.exports = UserProfileService;
