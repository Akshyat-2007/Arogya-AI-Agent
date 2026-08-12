const FamilyMember = require('./member');
const WeightLog = require('./weightLog');
const ChatHistory = require('./chat');
const MealPlan = require('./mealPlan');

// Define relationships
FamilyMember.hasMany(WeightLog, {
  foreignKey: 'member_id',
  as: 'weight_logs',
  onDelete: 'CASCADE'
});
WeightLog.belongsTo(FamilyMember, {
  foreignKey: 'member_id',
  as: 'member'
});

FamilyMember.hasMany(MealPlan, {
  foreignKey: 'member_id',
  as: 'meal_plans',
  onDelete: 'CASCADE'
});
MealPlan.belongsTo(FamilyMember, {
  foreignKey: 'member_id',
  as: 'member'
});

FamilyMember.hasMany(ChatHistory, {
  foreignKey: 'member_id',
  as: 'chat_histories',
  onDelete: 'CASCADE'
});
ChatHistory.belongsTo(FamilyMember, {
  foreignKey: 'member_id',
  as: 'member'
});

module.exports = {
  FamilyMember,
  WeightLog,
  ChatHistory,
  MealPlan
};
