let menuItems = [
    "백반", "죽·국수", "중식", "양식", "분식",
    "패스트푸드", "족발·보쌈", "찜·탕", "돈까스·회", "고기구이·도시락"
];

const sectorAngle = 360 / menuItems.length;
const roulette = document.getElementById('roulette');
const startButton = document.getElementById('start');
const result = document.getElementById('result');
const ticketsDisplay = document.getElementById('tickets');
const tickSound = document.getElementById('tickSound');

let tickets = 3;
let lastUpdate = localStorage.getItem('lastUpdatedDate');
let currentRotation = 0; // 전역 변수로 추가

function initTickets() {
    const today = new Date().toISOString().slice(0,10);
    if (lastUpdate !== today) {
        tickets = 3;
        localStorage.setItem('rouletteTickets', tickets);
        localStorage.setItem('lastUpdatedDate', today);
        lastUpdate = today;
    } else {
        tickets = parseInt(localStorage.getItem('rouletteTickets')) || 3;
    }
    updateTicketDisplay();
}

function updateTicketDisplay() {
    ticketsDisplay.innerText = `남은 이용권: ${tickets}회`;
    if (tickets <= 0) {
        startButton.disabled = true;
        startButton.style.backgroundColor = '#aaa';
    } else {
        startButton.disabled = false;
        startButton.style.backgroundColor = '#FF4D4D';
    }
}

function createRoulette() {
    const svg = document.getElementById('roulette');
    svg.innerHTML = '';
    const cx = 160, cy = 160, r = 150;
    const sectorAngle = 360 / menuItems.length;
    menuItems.forEach((item, i) => {
        const startAngle = (i * sectorAngle - 90) * Math.PI / 180;
        const endAngle = ((i + 1) * sectorAngle - 90) * Math.PI / 180;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);

        // Path for sector
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const largeArc = sectorAngle > 180 ? 1 : 0;
        path.setAttribute('d',
            `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`
        );
        path.setAttribute('fill', i % 2 === 0 ? '#fefefe' : '#f0f0f0');
        path.setAttribute('stroke', '#ddd');
        path.setAttribute('stroke-width', '1');
        svg.appendChild(path);

        // Text for sector
        const textAngle = (i + 0.5) * sectorAngle - 90;
        const textRad = textAngle * Math.PI / 180;
        const tx = cx + (r * 0.65) * Math.cos(textRad);
        const ty = cy + (r * 0.65) * Math.sin(textRad);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', tx);
        text.setAttribute('y', ty);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-size', '13');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', '#222');
        text.setAttribute('class', 'roulette-label');
        text.setAttribute('transform', `rotate(${textAngle},${tx},${ty})`);
        text.textContent = item;
        svg.appendChild(text);
    });
}

function playTick() {
    tickSound.currentTime = 0;
    tickSound.play();
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}

function spinRoulette() {
    if (tickets <= 0) {
        alert("오늘의 이용권을 모두 사용했습니다!");
        return;
    }

    tickets--;
    localStorage.setItem('rouletteTickets', tickets);
    updateTicketDisplay();
    startButton.disabled = true;
    result.style.opacity = 0;
    result.style.transform = 'scale(0.8)';

    const spins = Math.floor(Math.random() * 3) + 5;
    const randomSector = Math.floor(Math.random() * menuItems.length);

    const sectorAngle = 360 / menuItems.length;
    const targetAngle = (randomSector + 0.5) * sectorAngle - 90;
    const rotateTo = spins * 360 - targetAngle - 90;

    const svg = document.getElementById('roulette');
    svg.style.transition = 'none';
    svg.style.transform = `rotate(0deg)`;
    setTimeout(() => {
        svg.style.transition = 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)';
        svg.style.transform = `rotate(${rotateTo}deg)`;
    }, 10);

    // 효과음 및 진동 애니메이션
    let tickCount = 40;
    let tickInterval = setInterval(() => {
        tickSound.currentTime = 0;
        tickSound.play();
        if (navigator.vibrate) navigator.vibrate(10);
        tickCount--;
        if (tickCount <= 0) clearInterval(tickInterval);
    }, 100);

    setTimeout(() => {
        svg.style.transition = 'none';
        result.innerText = `${menuItems[randomSector]}`;
        result.style.opacity = 1;
        result.style.transform = 'scale(1)';
        startButton.disabled = false;
    }, 4000);
}

startButton.addEventListener('click', spinRoulette);

createRoulette();
initTickets();

const findBtn = document.getElementById('find-restaurants');
findBtn.addEventListener('click', function() {
  findBtn.disabled = true; // 버튼 비활성화

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    alert('이 브라우저에서는 위치 정보가 지원되지 않습니다.');
  }

  // 3초 후 버튼 다시 활성화
  setTimeout(() => {
    findBtn.disabled = false;
  }, 3000);
});

function success(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  // 카카오 장소 검색 객체 생성
  const ps = new kakao.maps.services.Places();

  // 음식점 카테고리(FD6), 반경 50m, 최대 8개
  ps.categorySearch('FD6', function(data, status) {
    if (status === kakao.maps.services.Status.OK) {
      const menuList = document.getElementById('roulette-menu');
      menuList.innerHTML = ''; // 기존 목록 초기화

      // 최대 8개만 표시
      menuItems = data.slice(0, 8).map(place => place.place_name);
      createRoulette();
    } else {
      alert('주변 식당을 찾을 수 없습니다.');
    }
  }, {
    location: new kakao.maps.LatLng(lat, lng),
    radius: 50
  });
}

function error() {
  alert('위치 정보를 가져올 수 없습니다.');
} 