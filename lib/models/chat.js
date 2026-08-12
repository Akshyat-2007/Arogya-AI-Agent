import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class ChatHistory extends Model {
  toDict() {
    const formattedTimestamp = this.timestamp
      ? new Date(this.timestamp).toISOString().replace('T', ' ').substring(0, 19)
      : '';
    return {
      id: this.id,
      member_id: this.member_id,
      sender: this.sender,
      message: this.message,
      timestamp: formattedTimestamp
    };
  }
}

ChatHistory.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  member_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sender: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'ChatHistory',
  tableName: 'chat_histories',
  timestamps: false
});

export default ChatHistory;
