const staticPageService = require('../services/static-page.service.js');

const createStaticPage = async (req, res) => {
  try {
    const pageData = req.body;
    if (!pageData.pageType || !pageData.title) {
      return res.status(400).json({ 
        message: 'Page type and title are required' 
      });
    }
    
    const page = await staticPageService.createStaticPage(pageData);
    res.status(201).json({ 
      message: 'Page created successfully', 
      page 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create page', 
      error: error.message 
    });
  }
};

const getAllStaticPages = async (req, res) => {
  try {
    const pages = await staticPageService.getAllStaticPages();
    res.status(200).json({ pages });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch pages', 
      error: error.message 
    });
  }
};

const getStaticPageByType = async (req, res) => {
  try {
    const { pageType } = req.params;
    const page = await staticPageService.getStaticPageByType(pageType);
    res.status(200).json({ page });
  } catch (error) {
    res.status(404).json({ 
      message: error.message 
    });
  }
};

const updateStaticPage = async (req, res) => {
  try {
    const { pageType } = req.params;
    const updateData = req.body;
    const page = await staticPageService.updateStaticPage(pageType, updateData);
    res.status(200).json({ 
      message: 'Page updated successfully', 
      page 
    });
  } catch (error) {
    res.status(404).json({ 
      message: error.message 
    });
  }
};

const deleteStaticPage = async (req, res) => {
  try {
    const { pageType } = req.params;
    const result = await staticPageService.deleteStaticPage(pageType);
    console.log(` Static page deleted: ${pageType}`);
    res.status(200).json(result);
  } catch (error) {
    console.error(` Failed to delete static page: ${error.message}`);
    res.status(404).json({ 
      message: error.message 
    });
  }
};


module.exports = {
  createStaticPage,
  getAllStaticPages,
  getStaticPageByType,
  updateStaticPage,
  deleteStaticPage
};