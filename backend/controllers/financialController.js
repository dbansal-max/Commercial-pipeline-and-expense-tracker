const { FinancialRecord, User, EditDeleteRequest } = require('../models');
const { Op } = require('sequelize');

const canViewAllRecords = (roleName) =>
  ['Admin', 'Finance Manager', 'Analyst'].includes(roleName);

const createRecord = async (req, res) => {
  try {
    const { amount, type, category, date, notes, userId: requestedUserId } = req.body;
    let userId = req.user.id;

    // Check if user has permission to create records
    if (req.user.role.name === 'Analyst') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Analysts cannot create records'
      });
    }

    // Validate input
    if (!amount || !type || !category || !date) {
      return res.status(400).json({
        success: false,
        message: 'Amount, type, category, and date are required'
      });
    }

    if (requestedUserId && ['Admin', 'Finance Manager'].includes(req.user.role.name)) {
      userId = requestedUserId;
    }

    // Create record
    const record = await FinancialRecord.create({
      user_id: userId,
      amount,
      type,
      category,
      date,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Financial record created successfully',
      data: { record }
    });
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create financial record',
      error: error.message
    });
  }
};

const getAllRecords = async (req, res) => {
  try {
    console.log('🔍 getAllRecords called');
    console.log('🔍 User:', req.user);
    console.log('🔍 Query params:', req.query);

    const {
      page = 1,
      limit = 10,
      type = '',
      category = '',
      startDate = '',
      endDate = '',
      userId = '',
      search = ''
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      is_deleted: false
    };

    // Role-based access control
    if (!canViewAllRecords(req.user.role.name)) {
      // Most roles should only see their own records
      whereClause.user_id = req.user.id;
      console.log('🔍 User can only see own records, user_id:', req.user.id);
    } else {
      // Elevated roles can see all records, or scope to one user when requested
      if (userId) {
        whereClause.user_id = userId;
        console.log('🔍 Admin filtering by user_id:', userId);
      }
    }

    console.log('🔍 Where clause:', whereClause);

    // Apply filters
    if (type) {
      whereClause.type = type;
    }
    if (category) {
      whereClause.category = category;
    }
    if (search) {
      const searchPattern = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { category: { [Op.iLike]: searchPattern } },
        { notes: { [Op.iLike]: searchPattern } }
      ];

      if (canViewAllRecords(req.user.role.name)) {
        whereClause[Op.or].push(
          { '$user.name$': { [Op.iLike]: searchPattern } },
          { '$user.email$': { [Op.iLike]: searchPattern } }
        );
      }
    }
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      whereClause.date = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      whereClause.date = {
        [Op.lte]: endDate
      };
    }

    const { count, rows: records } = await FinancialRecord.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      distinct: true,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC'], ['created_at', 'DESC']]
    });

    console.log('🔍 Database query result:');
    console.log('  - Count:', count);
    console.log('  - Records found:', records.length);
    console.log('  - First record:', records[0] || 'No records');

    const responseData = {
      success: true,
      data: {
        records,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    };

    console.log('🔍 Sending response:', responseData);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Get all records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial records',
      error: error.message
    });
  }
};

const getRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await FinancialRecord.findOne({
      where: {
        id,
        is_deleted: false
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Financial record not found'
      });
    }

    // Check if user has permission to view this record
    if (!canViewAllRecords(req.user.role.name) && record.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own records'
      });
    }

    res.status(200).json({
      success: true,
      data: { record }
    });
  } catch (error) {
    console.error('Get record by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial record',
      error: error.message
    });
  }
};

const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, category, date, notes } = req.body;

    const record = await FinancialRecord.findByPk(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Financial record not found'
      });
    }

    // Only Admin can directly update records
    if (req.user.role.name === 'Admin') {
      // Admin can directly edit any user's records
      const updateData = {};
      if (amount !== undefined) updateData.amount = amount;
      if (type !== undefined) updateData.type = type;
      if (category !== undefined) updateData.category = category;
      if (date !== undefined) updateData.date = date;
      if (notes !== undefined) updateData.notes = notes;

      await record.update(updateData);

      res.status(200).json({
        success: true,
        message: 'Financial record updated successfully',
        data: { record }
      });
    } else {
      if (record.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only request edits for your own records'
        });
      }

      // All other users must create edit request for admin approval
      const requestedChanges = {};
      if (amount !== undefined && amount !== record.amount) requestedChanges.amount = amount;
      if (type !== undefined && type !== record.type) requestedChanges.type = type;
      if (category !== undefined && category !== record.category) requestedChanges.category = category;
      if (date !== undefined && date !== record.date) requestedChanges.date = date;
      if (notes !== undefined && notes !== record.notes) requestedChanges.notes = notes;

      if (Object.keys(requestedChanges).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No changes detected'
        });
      }

      const editRequest = await EditDeleteRequest.create({
        user_id: req.user.id,
        record_id: id,
        type: 'Edit',
        requested_changes: requestedChanges,
        reason: req.body.reason || 'User requested edit'
      });

      return res.status(200).json({
        success: true,
        message: 'Edit request submitted for admin approval',
        data: { editRequest }
      });
    }
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update financial record',
      error: error.message
    });
  }
};

const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await FinancialRecord.findByPk(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Financial record not found'
      });
    }

    // Only Admin can directly delete records
    if (req.user.role.name === 'Admin') {
      // Admin can directly delete any user's records
      await record.update({ is_deleted: true });

      res.status(200).json({
        success: true,
        message: 'Financial record deleted successfully'
      });
    } else {
      if (record.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only request deletion for your own records'
        });
      }

      // All other users must create delete request for admin approval
      const deleteRequest = await EditDeleteRequest.create({
        user_id: req.user.id,
        record_id: id,
        type: 'Delete',
        reason: req.body.reason || 'User requested deletion'
      });

      return res.status(200).json({
        success: true,
        message: 'Delete request submitted for admin approval',
        data: { deleteRequest }
      });
    }
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete financial record',
      error: error.message
    });
  }
};

module.exports = {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord
};
