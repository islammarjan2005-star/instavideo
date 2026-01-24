// SyncView - AI-Powered Comparative Video Learning
// Static version for GitHub Pages

// ============ CONFIGURATION ============
const VIDEO_COLORS = [
  { bg: '#3b82f6', name: 'blue' },
  { bg: '#a855f7', name: 'purple' },
  { bg: '#22c55e', name: 'green' },
  { bg: '#f97316', name: 'orange' },
  { bg: '#ec4899', name: 'pink' },
  { bg: '#06b6d4', name: 'cyan' }
];

const SEGMENT_TEMPLATES = [
  { name: 'Introduction', description: 'Opening and topic introduction', duration: 60 },
  { name: 'Core Concepts', description: 'Main ideas and fundamentals', duration: 90 },
  { name: 'Deep Dive', description: 'Detailed explanation and examples', duration: 90 },
  { name: 'Practical Application', description: 'Real-world examples and use cases', duration: 60 },
  { name: 'Conclusion', description: 'Summary and key takeaways', duration: 60 }
];

// ============ STATE ============
let state = {
  videos: [],
  topic: '',
  segments: [],
  currentSegmentIndex: 0,
  currentVideoIndex: 0,
  isPlaying: false,
  autoSwitch: true,
  volume: 100,
  isMuted: false,
  players: {},
  playerReady: {},
  videoDurations: {},
  lastSwitchTime: 0
};

// ============ UTILITY FUNCTIONS ============
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getVideoColor(index) {
  return VIDEO_COLORS[index % VIDEO_COLORS.length];
}

function getThumbnailUrl(videoId) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

// ============ DOM ELEMENTS ============
const elements = {
  // Pages
  homePage: document.getElementById('home-page'),
  playerPage: document.getElementById('player-page'),
  loadingOverlay: document.getElementById('loading-overlay'),

  // Home page
  topicInput: document.getElementById('topic-input'),
  videoInputsContainer: document.getElementById('video-inputs'),
  addVideoBtn: document.getElementById('add-video-btn'),
  startBtn: document.getElementById('start-btn'),
  errorMessage: document.getElementById('error-message'),

  // Player page
  backBtn: document.getElementById('back-btn'),
  playerTopic: document.getElementById('player-topic'),
  playerVideoCount: document.getElementById('player-video-count'),
  videoContainer: document.getElementById('video-container'),
  currentVideoIndicator: document.getElementById('current-video-indicator'),
  currentVideoTitle: document.getElementById('current-video-title'),
  segmentTopic: document.getElementById('segment-topic'),
  segmentDescription: document.getElementById('segment-description'),
  currentTime: document.getElementById('current-time'),
  segmentProgress: document.getElementById('segment-progress'),
  timeline: document.getElementById('timeline'),
  videoLegend: document.getElementById('video-legend'),
  elapsedTime: document.getElementById('elapsed-time'),
  totalTime: document.getElementById('total-time'),
  prevSegmentBtn: document.getElementById('prev-segment-btn'),
  playPauseBtn: document.getElementById('play-pause-btn'),
  nextSegmentBtn: document.getElementById('next-segment-btn'),
  autoSwitchBtn: document.getElementById('auto-switch-btn'),
  muteBtn: document.getElementById('mute-btn'),
  volumeSlider: document.getElementById('volume-slider'),
  thumbnailsGrid: document.getElementById('thumbnails-grid'),
  segmentsContainer: document.getElementById('segments-container'),
  insightsToggle: document.getElementById('insights-toggle'),
  insightsPanel: document.querySelector('.insights'),
  convergencePoints: document.getElementById('convergence-points'),
  divergencePoints: document.getElementById('divergence-points'),
  loadingStatus: document.getElementById('loading-status')
};

// ============ HOME PAGE FUNCTIONS ============
function initHomePage() {
  // Add video button
  elements.addVideoBtn.addEventListener('click', addVideoInput);

  // Start button
  elements.startBtn.addEventListener('click', handleStart);
}

function addVideoInput() {
  const inputs = elements.videoInputsContainer.querySelectorAll('.video-input-row');
  if (inputs.length >= 6) {
    elements.addVideoBtn.disabled = true;
    return;
  }

  const index = inputs.length + 1;
  const row = document.createElement('div');
  row.className = 'video-input-row';
  row.innerHTML = `
    <input type="text" class="video-url" placeholder="Video ${index} URL (youtube.com/watch?v=... or youtu.be/...)">
    <span class="video-num">#${index}</span>
    <button class="remove-video-btn" onclick="removeVideoInput(this)">✕</button>
  `;
  elements.videoInputsContainer.appendChild(row);

  if (inputs.length + 1 >= 6) {
    elements.addVideoBtn.disabled = true;
  }
}

function removeVideoInput(button) {
  const row = button.parentElement;
  row.remove();

  // Renumber remaining inputs
  const rows = elements.videoInputsContainer.querySelectorAll('.video-input-row');
  rows.forEach((row, i) => {
    row.querySelector('.video-num').textContent = `#${i + 1}`;
    row.querySelector('.video-url').placeholder = `Video ${i + 1} URL (youtube.com/watch?v=... or youtu.be/...)`;
  });

  elements.addVideoBtn.disabled = false;
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.classList.add('visible');
}

function hideError() {
  elements.errorMessage.classList.remove('visible');
}

function handleStart() {
  hideError();

  const topic = elements.topicInput.value.trim();
  const urlInputs = elements.videoInputsContainer.querySelectorAll('.video-url');
  const urls = Array.from(urlInputs).map(input => input.value.trim()).filter(Boolean);

  if (urls.length < 2) {
    showError('Please enter at least 2 video URLs');
    return;
  }

  const videoIds = urls.map(extractVideoId);
  const invalidIndex = videoIds.findIndex(id => !id);

  if (invalidIndex !== -1) {
    showError(`Video ${invalidIndex + 1} URL is invalid. Please check and try again.`);
    return;
  }

  if (!topic) {
    showError('Please enter a topic to help the AI understand what to focus on');
    return;
  }

  // Start loading
  showLoading();

  // Initialize state
  state.topic = topic;
  state.videos = videoIds.map((id, index) => ({
    id,
    title: `Video ${index + 1}`,
    channelName: 'Loading...',
    index
  }));

  // Generate segments
  generateSegments();

  // Fetch video info
  fetchVideoInfo().then(() => {
    initPlayerPage();
    showPlayerPage();
    hideLoading();
  });
}

async function fetchVideoInfo() {
  updateLoadingStatus('Fetching video information...');

  const promises = state.videos.map(async (video) => {
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${video.id}&format=json`
      );
      if (response.ok) {
        const data = await response.json();
        video.title = data.title || video.title;
        video.channelName = data.author_name || 'Unknown Channel';
      }
    } catch (e) {
      // Keep default values
    }
  });

  await Promise.all(promises);
  updateLoadingStatus('Preparing player...');
}

function generateSegments() {
  updateLoadingStatus('Analyzing video structure...');

  let currentTime = 0;
  state.segments = SEGMENT_TEMPLATES.map((template, index) => {
    const startTime = currentTime;
    const endTime = currentTime + template.duration;
    currentTime = endTime;

    // Create random recommended order for variety
    const recommendedOrder = [...state.videos]
      .sort(() => Math.random() - 0.5)
      .map(v => v.id);

    return {
      id: `segment-${index}`,
      topic: template.name,
      description: template.description,
      videos: state.videos.map(video => ({
        videoId: video.id,
        startTime,
        endTime,
        confidence: 0.7 + Math.random() * 0.3
      })),
      recommendedOrder
    };
  });
}

// ============ LOADING FUNCTIONS ============
function showLoading() {
  elements.loadingOverlay.classList.add('active');
}

function hideLoading() {
  elements.loadingOverlay.classList.remove('active');
}

function updateLoadingStatus(status) {
  elements.loadingStatus.textContent = status;
}

// ============ PAGE NAVIGATION ============
function showPlayerPage() {
  elements.homePage.classList.remove('active');
  elements.playerPage.classList.add('active');
}

function showHomePage() {
  elements.playerPage.classList.remove('active');
  elements.homePage.classList.add('active');

  // Clean up players
  Object.values(state.players).forEach(player => {
    try {
      player.destroy();
    } catch (e) {}
  });

  // Reset state
  state.players = {};
  state.playerReady = {};
  state.isPlaying = false;
}

// ============ PLAYER PAGE FUNCTIONS ============
function initPlayerPage() {
  // Update header
  elements.playerTopic.textContent = state.topic;
  elements.playerVideoCount.textContent = `${state.videos.length} videos compared`;

  // Create video iframes
  createVideoPlayers();

  // Render UI
  renderTimeline();
  renderThumbnails();
  renderSegmentsList();
  renderInsights();
  renderVideoLegend();

  // Update segment info
  updateSegmentInfo();

  // Setup event listeners
  setupPlayerControls();
  setupKeyboardShortcuts();

  // Back button
  elements.backBtn.addEventListener('click', showHomePage);
}

function createVideoPlayers() {
  elements.videoContainer.innerHTML = '';

  state.videos.forEach((video, index) => {
    const wrapper = document.createElement('div');
    wrapper.id = `player-${video.id}`;
    wrapper.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `;
    elements.videoContainer.appendChild(wrapper);
  });
}

// YouTube IFrame API callback
window.onYouTubeIframeAPIReady = function() {
  if (state.videos.length === 0) return;

  state.videos.forEach((video, index) => {
    const player = new YT.Player(`player-${video.id}`, {
      videoId: video.id,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 0,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        fs: 0,
        playsinline: 1,
        enablejsapi: 1
      },
      events: {
        onReady: (event) => onPlayerReady(video.id, event),
        onStateChange: (event) => onPlayerStateChange(video.id, event)
      }
    });

    state.players[video.id] = player;
  });
};

function onPlayerReady(videoId, event) {
  state.playerReady[videoId] = true;

  const player = event.target;
  const duration = player.getDuration();
  if (duration > 0) {
    state.videoDurations[videoId] = duration;
  }

  // Set initial active state
  updateActiveVideo();

  // Start time update interval
  if (!window.timeUpdateInterval) {
    window.timeUpdateInterval = setInterval(updateTimeDisplay, 250);
  }
}

function onPlayerStateChange(videoId, event) {
  const currentVideoId = getCurrentVideoId();
  if (videoId !== currentVideoId) return;

  if (event.data === YT.PlayerState.PLAYING) {
    state.isPlaying = true;
    updatePlayPauseButton();
  } else if (event.data === YT.PlayerState.PAUSED) {
    state.isPlaying = false;
    updatePlayPauseButton();
  } else if (event.data === YT.PlayerState.ENDED) {
    handleVideoEnded();
  }
}

function getCurrentVideoId() {
  const segment = state.segments[state.currentSegmentIndex];
  return segment?.recommendedOrder[state.currentVideoIndex] || state.videos[0]?.id;
}

function getCurrentPlayer() {
  return state.players[getCurrentVideoId()];
}

function updateActiveVideo() {
  const currentVideoId = getCurrentVideoId();

  // Update iframe visibility
  state.videos.forEach(video => {
    const iframe = document.querySelector(`#player-${video.id} iframe`);
    if (iframe) {
      if (video.id === currentVideoId) {
        iframe.classList.add('active');
      } else {
        iframe.classList.remove('active');
      }
    }
  });

  // Update indicator
  const videoIndex = state.videos.findIndex(v => v.id === currentVideoId);
  const video = state.videos[videoIndex];
  const color = getVideoColor(videoIndex);

  elements.currentVideoIndicator.style.color = color.bg;
  elements.currentVideoIndicator.querySelector('.indicator-dot').style.background = color.bg;
  elements.currentVideoTitle.textContent = video?.title || `Video ${videoIndex + 1}`;

  // Update thumbnails
  updateThumbnailsActive();

  // Update legend
  updateVideoLegend();
}

function updateSegmentInfo() {
  const segment = state.segments[state.currentSegmentIndex];
  if (!segment) return;

  elements.segmentTopic.textContent = segment.topic;
  elements.segmentDescription.textContent = segment.description;
  elements.segmentProgress.textContent = `Segment ${state.currentSegmentIndex + 1}/${state.segments.length}`;
}

function updateTimeDisplay() {
  const player = getCurrentPlayer();
  if (!player || !state.playerReady[getCurrentVideoId()]) return;

  try {
    const currentTime = player.getCurrentTime();
    elements.currentTime.textContent = formatTime(currentTime);
    elements.elapsedTime.textContent = formatTime(currentTime);

    // Calculate total duration
    const maxDuration = Math.max(...Object.values(state.videoDurations), 300);
    elements.totalTime.textContent = formatTime(maxDuration);

    // Update timeline progress
    updateTimelineProgress(currentTime);

    // Check for auto-switch
    if (state.autoSwitch && state.isPlaying) {
      checkAutoSwitch(currentTime);
    }
  } catch (e) {}
}

function updateTimelineProgress(currentTime) {
  const segment = state.segments[state.currentSegmentIndex];
  if (!segment) return;

  const videoData = segment.videos.find(v => v.videoId === getCurrentVideoId());
  if (!videoData) return;

  const segmentDuration = videoData.endTime - videoData.startTime;
  const elapsed = currentTime - videoData.startTime;
  const progress = Math.min(100, Math.max(0, (elapsed / segmentDuration) * 100));

  // Update timeline segment progress
  const segmentEl = elements.timeline.querySelector(`.timeline-segment:nth-child(${state.currentSegmentIndex + 1}) .progress`);
  if (segmentEl) {
    segmentEl.style.width = `${progress}%`;
  }
}

function checkAutoSwitch(currentTime) {
  const now = Date.now();
  if (now - state.lastSwitchTime < 3000) return; // Minimum 3 seconds between switches

  const segment = state.segments[state.currentSegmentIndex];
  if (!segment) return;

  const videoData = segment.videos.find(v => v.videoId === getCurrentVideoId());
  if (!videoData) return;

  const timeUntilEnd = videoData.endTime - currentTime;

  if (timeUntilEnd <= 2 && timeUntilEnd > 0) {
    state.lastSwitchTime = now;

    if (state.currentVideoIndex < segment.recommendedOrder.length - 1) {
      switchToVideo(state.currentVideoIndex + 1);
    } else if (state.currentSegmentIndex < state.segments.length - 1) {
      goToSegment(state.currentSegmentIndex + 1);
    }
  }
}

function handleVideoEnded() {
  const segment = state.segments[state.currentSegmentIndex];

  if (state.currentVideoIndex < segment.recommendedOrder.length - 1) {
    switchToVideo(state.currentVideoIndex + 1);
  } else if (state.currentSegmentIndex < state.segments.length - 1) {
    goToSegment(state.currentSegmentIndex + 1);
  } else {
    state.isPlaying = false;
    updatePlayPauseButton();
  }
}

// ============ PLAYBACK CONTROLS ============
function setupPlayerControls() {
  elements.playPauseBtn.addEventListener('click', togglePlayback);
  elements.prevSegmentBtn.addEventListener('click', previousSegment);
  elements.nextSegmentBtn.addEventListener('click', nextSegment);
  elements.autoSwitchBtn.addEventListener('click', toggleAutoSwitch);
  elements.muteBtn.addEventListener('click', toggleMute);
  elements.volumeSlider.addEventListener('input', handleVolumeChange);
  elements.insightsToggle.addEventListener('click', toggleInsights);
}

function togglePlayback() {
  const player = getCurrentPlayer();
  if (!player) return;

  if (state.isPlaying) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
}

function updatePlayPauseButton() {
  elements.playPauseBtn.textContent = state.isPlaying ? '⏸' : '▶';
}

function previousSegment() {
  if (state.currentSegmentIndex > 0) {
    goToSegment(state.currentSegmentIndex - 1);
  }
}

function nextSegment() {
  if (state.currentSegmentIndex < state.segments.length - 1) {
    goToSegment(state.currentSegmentIndex + 1);
  }
}

function goToSegment(index) {
  const currentPlayer = getCurrentPlayer();
  if (currentPlayer) {
    currentPlayer.pauseVideo();
  }

  state.currentSegmentIndex = index;
  state.currentVideoIndex = 0;

  const segment = state.segments[index];
  const firstVideoId = segment.recommendedOrder[0];
  const videoData = segment.videos.find(v => v.videoId === firstVideoId);

  updateActiveVideo();
  updateSegmentInfo();
  updateSegmentsList();
  renderTimeline();

  const player = state.players[firstVideoId];
  if (player && videoData) {
    player.seekTo(videoData.startTime, true);
    if (state.isPlaying) {
      setTimeout(() => player.playVideo(), 100);
    }
  }
}

function switchToVideo(videoIndex) {
  const currentPlayer = getCurrentPlayer();
  if (currentPlayer) {
    currentPlayer.pauseVideo();
  }

  state.currentVideoIndex = videoIndex;

  const segment = state.segments[state.currentSegmentIndex];
  const newVideoId = segment.recommendedOrder[videoIndex];
  const videoData = segment.videos.find(v => v.videoId === newVideoId);

  updateActiveVideo();

  const player = state.players[newVideoId];
  if (player && videoData) {
    player.seekTo(videoData.startTime, true);
    if (state.isPlaying) {
      setTimeout(() => player.playVideo(), 100);
    }
  }
}

function switchToVideoById(videoId) {
  const segment = state.segments[state.currentSegmentIndex];
  const videoIndex = segment.recommendedOrder.indexOf(videoId);
  if (videoIndex !== -1) {
    switchToVideo(videoIndex);
  }
}

function toggleAutoSwitch() {
  state.autoSwitch = !state.autoSwitch;
  elements.autoSwitchBtn.classList.toggle('active', state.autoSwitch);
}

function toggleMute() {
  const player = getCurrentPlayer();
  if (!player) return;

  state.isMuted = !state.isMuted;

  if (state.isMuted) {
    player.mute();
    elements.muteBtn.textContent = '🔇';
  } else {
    player.unMute();
    player.setVolume(state.volume);
    elements.muteBtn.textContent = '🔊';
  }
}

function handleVolumeChange(e) {
  state.volume = parseInt(e.target.value);
  const player = getCurrentPlayer();
  if (player) {
    player.setVolume(state.volume);
    if (state.volume > 0 && state.isMuted) {
      player.unMute();
      state.isMuted = false;
      elements.muteBtn.textContent = '🔊';
    }
  }
}

function toggleInsights() {
  elements.insightsPanel.classList.toggle('open');
}

// ============ KEYBOARD SHORTCUTS ============
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (!elements.playerPage.classList.contains('active')) return;

    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlayback();
        break;
      case 'ArrowRight':
        nextSegment();
        break;
      case 'ArrowLeft':
        previousSegment();
        break;
      case 'm':
        toggleMute();
        break;
      case 'a':
        toggleAutoSwitch();
        break;
    }
  });
}

// ============ RENDER FUNCTIONS ============
function renderTimeline() {
  const totalDuration = state.segments.reduce((acc, seg) => {
    const maxEnd = Math.max(...seg.videos.map(v => v.endTime));
    return Math.max(acc, maxEnd);
  }, 0);

  elements.timeline.innerHTML = state.segments.map((segment, index) => {
    const startTime = index === 0 ? 0 : state.segments[index - 1].videos[0].endTime;
    const endTime = Math.max(...segment.videos.map(v => v.endTime));
    const width = ((endTime - startTime) / totalDuration) * 100;

    const isPast = index < state.currentSegmentIndex;
    const isCurrent = index === state.currentSegmentIndex;

    return `
      <div class="timeline-segment ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''}"
           style="width: ${width}%"
           onclick="goToSegment(${index})"
           title="${segment.topic}">
        ${isCurrent ? '<div class="progress" style="width: 0%"></div>' : ''}
      </div>
    `;
  }).join('');
}

function renderVideoLegend() {
  const segment = state.segments[state.currentSegmentIndex];
  if (!segment) return;

  elements.videoLegend.innerHTML = segment.recommendedOrder.map((videoId, index) => {
    const videoIndex = state.videos.findIndex(v => v.id === videoId);
    const video = state.videos[videoIndex];
    const color = getVideoColor(videoIndex);
    const isActive = videoId === getCurrentVideoId();

    return `
      <div class="legend-item ${isActive ? 'active' : ''}">
        <span class="legend-dot ${isActive ? 'playing' : ''}" style="background: ${color.bg}"></span>
        <span>${video?.channelName?.slice(0, 15) || `Video ${videoIndex + 1}`}</span>
        ${isActive ? '<span style="color: var(--primary-400); margin-left: 4px;">playing</span>' : ''}
      </div>
    `;
  }).join('');
}

function updateVideoLegend() {
  renderVideoLegend();
}

function renderThumbnails() {
  const segment = state.segments[state.currentSegmentIndex];
  if (!segment) return;

  elements.thumbnailsGrid.innerHTML = segment.recommendedOrder.map((videoId) => {
    const videoIndex = state.videos.findIndex(v => v.id === videoId);
    const video = state.videos[videoIndex];
    const color = getVideoColor(videoIndex);
    const isActive = videoId === getCurrentVideoId();
    const videoData = segment.videos.find(v => v.videoId === videoId);

    return `
      <div class="thumbnail-card ${isActive ? 'active' : ''}"
           style="border-color: ${isActive ? color.bg : 'transparent'}"
           onclick="switchToVideoById('${videoId}')">
        <div class="thumbnail-image">
          <img src="${getThumbnailUrl(videoId)}" alt="${video.title}" loading="lazy">
          <div class="thumbnail-overlay">
            <div class="thumbnail-play">${isActive ? '▶' : '▷'}</div>
          </div>
          <span class="thumbnail-badge" style="background: ${color.bg}">#${videoIndex + 1}</span>
        </div>
        <div class="thumbnail-info">
          <p title="${video.title}">${video.title}</p>
          <p>${video.channelName}</p>
        </div>
      </div>
    `;
  }).join('');
}

function updateThumbnailsActive() {
  const cards = elements.thumbnailsGrid.querySelectorAll('.thumbnail-card');
  const currentVideoId = getCurrentVideoId();

  cards.forEach(card => {
    const videoId = card.getAttribute('onclick').match(/'([^']+)'/)[1];
    const isActive = videoId === currentVideoId;
    card.classList.toggle('active', isActive);

    if (isActive) {
      const videoIndex = state.videos.findIndex(v => v.id === videoId);
      const color = getVideoColor(videoIndex);
      card.style.borderColor = color.bg;
    } else {
      card.style.borderColor = 'transparent';
    }
  });
}

function renderSegmentsList() {
  elements.segmentsContainer.innerHTML = state.segments.map((segment, index) => {
    const isActive = index === state.currentSegmentIndex;

    return `
      <div class="segment-item ${isActive ? 'active' : ''}" onclick="goToSegment(${index})">
        <div class="segment-item-header">
          <span class="segment-item-num">#${index + 1}</span>
          <span class="segment-item-title">${segment.topic}</span>
        </div>
        <p class="segment-item-desc">${segment.description}</p>
      </div>
    `;
  }).join('');
}

function updateSegmentsList() {
  const items = elements.segmentsContainer.querySelectorAll('.segment-item');
  items.forEach((item, index) => {
    item.classList.toggle('active', index === state.currentSegmentIndex);
  });
}

function renderInsights() {
  // Generate insights based on topic
  const convergence = [
    `All videos cover the fundamentals of ${state.topic}`,
    'Common examples and use cases are discussed',
    'Key terminology is consistent across videos'
  ];

  const divergence = [
    'Different teaching styles and approaches',
    'Varying levels of depth and complexity',
    'Unique examples and analogies used'
  ];

  elements.convergencePoints.innerHTML = convergence.map(point =>
    `<li>${point}</li>`
  ).join('');

  elements.divergencePoints.innerHTML = divergence.map(point =>
    `<li>${point}</li>`
  ).join('');
}

// ============ MAKE FUNCTIONS GLOBAL ============
window.removeVideoInput = removeVideoInput;
window.goToSegment = goToSegment;
window.switchToVideoById = switchToVideoById;

// ============ INITIALIZE ============
document.addEventListener('DOMContentLoaded', initHomePage);
