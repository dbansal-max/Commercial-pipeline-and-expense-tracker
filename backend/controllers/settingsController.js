const { AppSetting } = require('../models');
const { getDefaultAppSettings } = require('../config/defaults');

const mergeSettings = (current, incoming) => {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return current;
  }

  return Object.entries(incoming).reduce((result, [key, value]) => {
    const currentValue = result[key];

    if (Array.isArray(value)) {
      result[key] = [...value];
      return result;
    }

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      currentValue &&
      typeof currentValue === 'object' &&
      !Array.isArray(currentValue)
    ) {
      result[key] = mergeSettings(currentValue, value);
      return result;
    }

    result[key] = value;
    return result;
  }, { ...current });
};

const getSettingsRecord = async () => {
  const defaults = getDefaultAppSettings();
  const [record] = await AppSetting.findOrCreate({
    where: { key: 'global' },
    defaults: { settings: defaults }
  });

  if (!record.settings) {
    await record.update({ settings: defaults });
    return record.reload();
  }

  return record;
};

const getSettings = async (req, res) => {
  try {
    const record = await getSettingsRecord();

    res.status(200).json({
      success: true,
      data: record.settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load settings',
      error: error.message
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Settings payload must be an object'
      });
    }

    const record = await getSettingsRecord();
    const nextSettings = mergeSettings(record.settings || getDefaultAppSettings(), updates);

    await record.update({
      settings: nextSettings,
      updated_by: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: nextSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
