const db = require('../../models');
const StaticPage = db.StaticPage;

const createStaticPage = async (pageData) => {
  return await StaticPage.create(pageData);
};

const getAllStaticPages = async () => {
  return await StaticPage.findAll({
    order: [['pageType', 'ASC']]
  });
};

const getStaticPageByType = async (pageType) => {
  const page = await StaticPage.findOne({ where: { pageType } });
  if (!page) {
    throw new Error('Page not found');
  }
  return page;
};

const updateStaticPage = async (pageType, updateData) => {
  const page = await StaticPage.findOne({ where: { pageType } });
  if (!page) {
    throw new Error('Page not found');
  }
  return await page.update(updateData);
};

const deleteStaticPage = async (pageType) => {
  const page = await StaticPage.findOne({ where: { pageType } });
  if (!page) {
    throw new Error('Page not found');
  }
  await page.destroy();
  return { message: 'Page deleted successfully' };
};

module.exports = {
  createStaticPage,
  getAllStaticPages,
  getStaticPageByType,
  updateStaticPage,
  deleteStaticPage
};