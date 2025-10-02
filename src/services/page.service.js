const db = require('../../models');
const { Page } = db;
const { v4: uuidv4 } = require('uuid'); 


const getPageBySlug = async (slug) => {
    const page = await Page.findOne({ where: { slug: slug } });
    if (!page) {
        throw new Error("Page not found.");
    }
    return page;
};

const getAllPagesForAdmin = async () => {
    return await Page.findAll({
        order: [['id', 'ASC']]
    });
};

const updatePageBySlug = async (slug, data) => {
    const page = await Page.findOne({ where: { slug: slug } });
    if (!page) {
        throw new Error("Page not found.");
    }
        const updatePayload = {};
    if (data.title) {
        updatePayload.title = data.title;
    }
    if (data.content) {
        updatePayload.content = { ...page.content, ...data.content };
    }
    if (Object.keys(updatePayload).length === 0) {
        return page;
    }
    await page.update(updatePayload);
        return page;
};

const updatePageSection = async (slug, sectionId, sectionData) => {
    const page = await Page.findOne({ where: { slug: slug } });
    if (!page) throw new Error("Page not found.");
    const content = page.content; 
    if (!content.sections || !Array.isArray(content.sections)) {
        throw new Error("This page does not have a valid sections structure.");
    }
    const sectionIndex = content.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) {
        throw new Error("Section with the given ID not found.");
    }
    content.sections[sectionIndex] = { ...content.sections[sectionIndex], ...sectionData };
        await page.update({ content });
    return page.content.sections[sectionIndex]; 
};

const deletePageSection = async (slug, sectionId) => {
    const page = await Page.findOne({ where: { slug } });
    if (!page) {
        throw new Error("Page not found.");
    }
        const content = page.content;
    if (!content.sections || !Array.isArray(content.sections)) {
        throw new Error("This page does not have a valid sections structure.");
    }
    const sectionIndex = content.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) {
        throw new Error(`Section with ID "${sectionId}" not found in this page.`);
    }
    content.sections.splice(sectionIndex, 1); 
        page.changed('content', true);
    await page.save();
    return { message: `Section with ID "${sectionId}" deleted successfully.` };
};

const addPageSection = async (slug, sectionData) => {
    const { title, content } = sectionData;
    if (!title || !content) {
        throw new Error("Section title and content are required.");
    }
    const page = await Page.findOne({ where: { slug: slug } });
    if (!page) {
        throw new Error("Page not found.");
    }
    const pageContent = page.content;
    if (!pageContent.sections || !Array.isArray(pageContent.sections)) {
        throw new Error("This page is not configured to have sections.");
    }
        const newSection = {
        id: `sec_${uuidv4()}`, 
        title: title,
        content: content,
        displayOrder: pageContent.sections.length + 1
    };
    pageContent.sections.push(newSection);
    page.changed('content', true);
    await page.save();
    return newSection; 
};


module.exports = {
    getPageBySlug,
    getAllPagesForAdmin,
    updatePageBySlug,
    updatePageSection,
    deletePageSection,
    addPageSection
};