const express = require('express');
const router = express.Router();
const {
    getCandidates,
    getCandidateById,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    getCandidateFiltersMeta,
} = require('../controllers/candidateController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/meta/filters', getCandidateFiltersMeta);
router.get('/', getCandidates);
router.get('/:id', getCandidateById);
router.post('/', authorize('ADMIN'), createCandidate);
router.put('/:id', authorize('ADMIN', 'REVIEWER'), updateCandidate);
router.delete('/:id', authorize('ADMIN'), deleteCandidate);

module.exports = router;