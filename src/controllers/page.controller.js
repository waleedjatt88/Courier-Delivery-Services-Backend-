const pageService = require('../services/page.service.js');


const getAllPublicPages = async (req, res) => {
    try {
        const pagesObject = await pageService.getAllPagesForPublic();
        res.status(200).json(pagesObject);
    } catch (error) {
        console.error("Error fetching public pages list:", error);
        res.status(500).json({ message: "Failed to fetch public pages." });
    }
};

const getAllPages = async (req, res) => {
    try {
        const pages = await pageService.getAllPagesForAdmin();
        res.status(200).json(pages);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch pages." });
    }};

const updatePage = async (req, res) => {
    try {
        const updatedPage = await pageService.updatePageBySlug(req.params.slug, req.body);
        res.status(200).json({ message: "Page updated successfully.", data: updatedPage });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }};

const updateSection = async (req, res) => {
    try {
        const { slug, sectionId } = req.params;
        const updatedSection = await pageService.updatePageSection(slug, sectionId, req.body);
        res.status(200).json({ message: "Section updated successfully.", data: updatedSection });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }};

const deleteSection = async (req, res) => {
    try {
        const { slug, sectionId } = req.params;
        const result = await pageService.deletePageSection(slug, sectionId);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }};

const addSection = async (req, res) => {
    try {
        const { slug } = req.params;
        const newSection = await pageService.addPageSection(slug, req.body);
        res.status(201).json({ message: "Section added successfully.", data: newSection });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }};


module.exports = {
    getAllPublicPages,
    getAllPages,
    updatePage,
    updateSection,
    deleteSection,
    addSection
};