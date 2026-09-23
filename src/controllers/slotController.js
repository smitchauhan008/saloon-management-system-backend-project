const slotService = require('../services/slotService');

class SlotController {
  async getSlots(req, res, next) {
    try {
      const { barber_id, date, service_id } = req.query;
      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date query parameter is required (YYYY-MM-DD)'
        });
      }

      const slotData = await slotService.getAvailableSlots({
        barber_id,
        date,
        service_id
      });

      res.status(200).json({
        success: true,
        data: slotData
      });
    } catch (error) {
      next(error);
    }
  }

  async createSlotBlock(req, res, next) {
    try {
      const exception = await slotService.createSlotBlock(req.body, req.user?._id);
      res.status(201).json({
        success: true,
        message: 'Operational window / calendar exception registered successfully',
        data: exception
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getExceptions(req, res, next) {
    try {
      const { type } = req.query;
      const exceptions = await slotService.getAllExceptions({ type });
      res.status(200).json({
        success: true,
        count: exceptions.length,
        data: exceptions
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteException(req, res, next) {
    try {
      await slotService.deleteException(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Calendar exception removed successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new SlotController();
