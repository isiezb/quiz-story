import { config } from './config.js';
import { apiService } from './apiService.js';
import { uiHandler } from './uiHandler.js';
import { quizHandler } from './quizHandler.js';
import { auth } from './auth.js';

// Initialize auth
auth.init();

// DOM Elements
const form = document.getElementById('storyForm');
const subjectSelect = document.getElementById('subject');
const otherSubjectGroup = document.getElementById('otherSubjectGroup');
const themeToggle = document.getElementById('themeToggle');

// Event Listeners
subjectSelect.addEventListener('change', () => {
    otherSubjectGroup.style.display = subjectSelect.value === 'other' ? 'block' : 'none';
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    if (submitButton.disabled) return;
    
    uiHandler.updateSubmitButton(submitButton, true);
    uiHandler.showLoading();

    try {
        const formData = {
            academic_grade: document.getElementById('academicGrade').value,
            subject: document.getElementById('subject').value,
            subject_specification: document.getElementById('subjectSpecification').value,
            setting: document.getElementById('setting').value,
            main_character: document.getElementById('mainCharacter').value,
            word_count: parseInt(document.getElementById('wordCount').value),
            language: document.getElementById('language').value,
            generate_vocabulary: document.getElementById('generateVocabulary').checked,
            generate_summary: document.getElementById('generateSummary').checked
        };

        console.log('Submitting form data:', formData);
        const data = await apiService.generateStory(formData);
        console.log('Received response:', data);
        
        uiHandler.displayStory(data);
        
        if (data.quiz) {
            quizHandler.displayQuiz(data.quiz);
        }

        uiHandler.showSuccess('Story generated successfully!');

    } catch (error) {
        console.error('Error:', error);
        uiHandler.showError(error.message || 'Failed to generate story');
    } finally {
        uiHandler.hideLoading();
        uiHandler.updateSubmitButton(submitButton, false);
    }
});

// Theme handling
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (prefersDark) {
    document.body.setAttribute('data-theme', 'dark');
    themeToggle.querySelector('span:first-child').textContent = '☀️';
    themeToggle.querySelector('span:last-child').textContent = 'Light Mode';
}

themeToggle.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeToggle.querySelector('span:first-child').textContent = isDark ? '🌙' : '☀️';
    themeToggle.querySelector('span:last-child').textContent = isDark ? 'Dark Mode' : 'Light Mode';
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const submitButton = document.querySelector('button[type="submit"]');
        if (!submitButton.disabled) {
            submitButton.click();
        }
    }
});

// Global functions for story management
window.viewStory = async (storyId) => {
    try {
        const story = await apiService.getStoryById(storyId);
        uiHandler.displayStory(story);
        if (story.quiz) {
            quizHandler.displayQuiz(story.quiz);
        }
        document.getElementById('storyOutput').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error viewing story:', error);
        uiHandler.showError(error);
    }
};

window.deleteStory = async (storyId) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
        await apiService.deleteStory(storyId);
        const { data: { session } } = await auth.supabase.auth.getSession();
        if (session) {
            const stories = await apiService.fetchUserStories(session.user.id);
            uiHandler.displayStoriesGrid(stories);
            uiHandler.showSuccess('Story deleted successfully');
        }
    } catch (error) {
        console.error('Error deleting story:', error);
        uiHandler.showError(error);
    }
}; 