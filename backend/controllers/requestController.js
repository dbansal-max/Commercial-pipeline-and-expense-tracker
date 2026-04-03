const { EditDeleteRequest, FinancialRecord, User } = require('../models');
const { Op } = require('sequelize');
const { sendEmail } = require('../services/EmailServices');
const {
  getEditRequestApprovedEmailBody,
  getEditRequestRejectedEmailBody,
  getDeleteRequestApprovedEmailBody,
  getDeleteRequestRejectedEmailBody
} = require('../services/EmailBody');

const canApproveAcrossUsers = (roleName) =>
  ['Admin', 'Finance Manager'].includes(roleName);

const normalizeRequestStatus = (status) => {
  const value = (status || '').toLowerCase();
  const statusMap = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected'
  };

  return statusMap[value] || '';
};

const normalizeRequestType = (type) => {
  const value = (type || '').toLowerCase();
  const typeMap = {
    edit: 'Edit',
    delete: 'Delete'
  };

  return typeMap[value] || '';
};

const createEditRequest = async (req, res) => {
  try {
    const { recordId, requestedChanges, reason } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!recordId || !requestedChanges || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Record ID, requested changes, and reason are required'
      });
    }

    // Check if record exists
    const record = await FinancialRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Financial record not found'
      });
    }

    // Check if user has permission to request edit
    if (!canApproveAcrossUsers(req.user.role.name) && record.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only request edits for your own records'
      });
    }

    // Check if there's already a pending request for this record
    const existingRequest = await EditDeleteRequest.findOne({
      where: {
        record_id: recordId,
        user_id: userId,
        type: 'Edit',
        status: 'Pending'
      }
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending edit request for this record'
      });
    }

    // Create edit request
    const editRequest = await EditDeleteRequest.create({
      user_id: userId,
      record_id: recordId,
      type: 'Edit',
      requested_changes: requestedChanges,
      reason
    });

    // Send email to admin
    try {
      const adminEmailBody = `New edit request submitted by ${req.user.name} for record ID: ${recordId}. Reason: ${reason}`;
      await sendEmail(
        'admin@finance.com', // This should be fetched from admin users
        'New Edit Request Submitted',
        adminEmailBody,
        'EditRequestSubmitted',
        userId
      );
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Edit request submitted successfully',
      data: { editRequest }
    });
  } catch (error) {
    console.error('Create edit request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit edit request',
      error: error.message
    });
  }
};

const createDeleteRequest = async (req, res) => {
  try {
    const { recordId, reason } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!recordId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Record ID and reason are required'
      });
    }

    // Check if record exists
    const record = await FinancialRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Financial record not found'
      });
    }

    // Check if user has permission to request deletion
    if (!canApproveAcrossUsers(req.user.role.name) && record.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only request deletion for your own records'
      });
    }

    // Check if there's already a pending request for this record
    const existingRequest = await EditDeleteRequest.findOne({
      where: {
        record_id: recordId,
        user_id: userId,
        type: 'Delete',
        status: 'Pending'
      }
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending delete request for this record'
      });
    }

    // Create delete request
    const deleteRequest = await EditDeleteRequest.create({
      user_id: userId,
      record_id: recordId,
      type: 'Delete',
      reason
    });

    // Send email to admin
    try {
      const adminEmailBody = `New delete request submitted by ${req.user.name} for record ID: ${recordId}. Reason: ${reason}`;
      await sendEmail(
        'admin@finance.com', // This should be fetched from admin users
        'New Delete Request Submitted',
        adminEmailBody,
        'DeleteRequestSubmitted',
        userId
      );
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Delete request submitted successfully',
      data: { deleteRequest }
    });
  } catch (error) {
    console.error('Create delete request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit delete request',
      error: error.message
    });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, type = '', status = 'Pending', userId = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    const normalizedStatus = normalizeRequestStatus(status);
    const normalizedType = normalizeRequestType(type);

    if (normalizedStatus) {
      whereClause.status = normalizedStatus;
    }

    if (normalizedType) {
      whereClause.type = normalizedType;
    }

    if (userId) {
      whereClause.user_id = userId;
    }

    if (search) {
      const searchPattern = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { reason: { [Op.iLike]: searchPattern } },
        { '$user.name$': { [Op.iLike]: searchPattern } },
        { '$user.email$': { [Op.iLike]: searchPattern } },
        { '$record.category$': { [Op.iLike]: searchPattern } },
        { '$record.notes$': { [Op.iLike]: searchPattern } }
      ];
    }

    const { count, rows: requests } = await EditDeleteRequest.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: FinancialRecord,
          as: 'record',
          attributes: ['id', 'amount', 'type', 'category', 'date', 'notes']
        }
      ],
      distinct: true,
      subQuery: false,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests',
      error: error.message
    });
  }
};

const getUserRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', type = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      user_id: req.user.id
    };

    const normalizedStatus = normalizeRequestStatus(status);
    const normalizedType = normalizeRequestType(type);

    if (normalizedStatus) {
      whereClause.status = normalizedStatus;
    }

    if (normalizedType) {
      whereClause.type = normalizedType;
    }

    if (search) {
      const searchPattern = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { reason: { [Op.iLike]: searchPattern } },
        { '$record.category$': { [Op.iLike]: searchPattern } },
        { '$record.notes$': { [Op.iLike]: searchPattern } }
      ];
    }

    const { count, rows: requests } = await EditDeleteRequest.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: FinancialRecord,
          as: 'record',
          attributes: ['id', 'amount', 'type', 'category', 'date', 'notes']
        }
      ],
      distinct: true,
      subQuery: false,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user requests',
      error: error.message
    });
  }
};

const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const request = await EditDeleteRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: FinancialRecord,
          as: 'record',
          attributes: ['id', 'amount', 'type', 'category', 'date', 'notes']
        }
      ]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    // Update request
    await request.update({
      status: 'Approved',
      admin_id: req.user.id,
      admin_notes: adminNotes
    });

    // Process the request
    if (request.type === 'Edit') {
      // Apply the requested changes
      const changes = request.requested_changes;
      const updateData = {};
      
      if (changes.amount !== undefined) updateData.amount = changes.amount;
      if (changes.type !== undefined) updateData.type = changes.type;
      if (changes.category !== undefined) updateData.category = changes.category;
      if (changes.date !== undefined) updateData.date = changes.date;
      if (changes.notes !== undefined) updateData.notes = changes.notes;

      await request.record.update(updateData);

      // Send email to user
      try {
        const emailBody = getEditRequestApprovedEmailBody(request.user.name, request.record.id);
        await sendEmail(
          request.user.email,
          'Edit Request Approved',
          emailBody,
          'EditRequestApproved',
          request.user.id
        );
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }
    } else if (request.type === 'Delete') {
      // Soft delete the record
      await request.record.update({ is_deleted: true });

      // Send email to user
      try {
        const emailBody = getDeleteRequestApprovedEmailBody(request.user.name, request.record.id);
        await sendEmail(
          request.user.email,
          'Delete Request Approved',
          emailBody,
          'DeleteRequestApproved',
          request.user.id
        );
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: `${request.type} request approved successfully`
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve request',
      error: error.message
    });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const request = await EditDeleteRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: FinancialRecord,
          as: 'record',
          attributes: ['id', 'amount', 'type', 'category', 'date']
        }
      ]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    // Update request
    await request.update({
      status: 'Rejected',
      admin_id: req.user.id,
      admin_notes: adminNotes
    });

    // Send email to user
    try {
      const emailBody = request.type === 'Edit' 
        ? getEditRequestRejectedEmailBody(request.user.name, request.record.id, adminNotes)
        : getDeleteRequestRejectedEmailBody(request.user.name, request.record.id, adminNotes);
      
      await sendEmail(
        request.user.email,
        `${request.type} Request Rejected`,
        emailBody,
        `${request.type}RequestRejected`,
        request.user.id
      );
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: `${request.type} request rejected successfully`
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject request',
      error: error.message
    });
  }
};

module.exports = {
  createEditRequest,
  createDeleteRequest,
  getPendingRequests,
  getUserRequests,
  approveRequest,
  rejectRequest
};
