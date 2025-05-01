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
    startButton.disabled = true; // 초기 상태를 비활성화로 설정
    startButton.style.backgroundColor = '#aaa';
}

function updateTicketDisplay() {
    const totalTickets = 3;
    const ticketsElement = document.getElementById('tickets');
    const totalTicketsElement = document.getElementById('total-tickets');
    
    ticketsElement.innerText = tickets;
    totalTicketsElement.innerText = totalTickets;
    
    // tickets가 0 이하일 때만 비활성화
    if (tickets <= 0) {
        startButton.disabled = true;
        startButton.style.backgroundColor = '#aaa';
    }
    // tickets가 0보다 크더라도 success 함수에서 활성화 여부를 결정
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
        selectedRestaurant = menuItems[randomSector]; // 선택된 식당 저장
        result.innerText = selectedRestaurant;
        result.style.opacity = 1;
        result.style.transform = 'scale(1)';
        startButton.disabled = false;
        
        // 식당이 선택되면 navigate 버튼 활성화
        navigateBtn.disabled = false;
        navigateBtn.style.backgroundColor = '#2997ff';
    }, 4000);
}

startButton.addEventListener('click', spinRoulette);

createRoulette();
initTickets();

const findBtn = document.getElementById('find-restaurants');
const countdownElement = document.getElementById('countdown');
const navigateBtn = document.getElementById('navigate');
let selectedRestaurant = null; // 선택된 식당 정보를 저장할 변수
let currentLat = null; // 현재 위도
let currentLng = null; // 현재 경도

// navigate 버튼 초기 상태 설정
navigateBtn.disabled = true;
navigateBtn.style.backgroundColor = '#aaa';

countdownElement.textContent = '5'; // 페이지 로드 시 기본값 설정

findBtn.addEventListener('click', function() {
    findBtn.disabled = true; // 버튼 비활성화
    let countdown = 5; // 5초 카운트다운

    // 카운트다운 표시
    countdownElement.textContent = countdown;

    const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            countdownElement.textContent = '5'; // 기본값으로 5 표시
            findBtn.disabled = false; // 카운트다운이 끝난 후에만 버튼 활성화
        }
    }, 1000);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error);
    } else {
        alert('이 브라우저에서는 위치 정보가 지원되지 않습니다.');
        findBtn.disabled = false; // 위치 정보를 가져올 수 없는 경우 버튼 활성화
    }
});

function success(position) {
  currentLat = position.coords.latitude;
  currentLng = position.coords.longitude;

  // 카카오 장소 검색 객체 생성
  const ps = new kakao.maps.services.Places();

  // 음식점 카테고리(FD6), 반경 100m, 최대 8개
  ps.categorySearch('FD6', function(data, status) {
    if (status === kakao.maps.services.Status.OK) {
      const menuList = document.getElementById('roulette-menu');
      menuList.innerHTML = ''; // 기존 목록 초기화

      // 현재 시간 기준으로 영업 중인 식당만 필터링
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute; // 현재 시간을 분으로 변환

      const openRestaurants = data.filter(place => {
        // 영업시간 정보가 있는 경우에만 처리
        if (place.business_hours) {
          const hours = place.business_hours.split('~');
          if (hours.length === 2) {
            const [openTime, closeTime] = hours.map(time => {
              const [hour, minute] = time.trim().split(':').map(Number);
              return hour * 60 + (minute || 0);
            });
            
            // 24시간 영업 체크
            if (openTime === 0 && closeTime === 1440) return true;
            
            // 현재 시간이 영업시간 내에 있는지 확인
            return currentTime >= openTime && currentTime <= closeTime;
          }
        }
        return false; // 영업시간 정보가 없으면 제외
      });

      // 최대 10개만 표시
      menuItems = openRestaurants.slice(0, 10).map(place => place.place_name);
      
      if (menuItems.length === 0) {
        alert('현재 영업 중인 식당이 없습니다.');
        findBtn.disabled = false;
        return;
      }

      createRoulette();
      
      // 식당을 성공적으로 불러왔을 때 start 버튼 활성화
      if (tickets > 0) {
        startButton.disabled = false;
        startButton.style.backgroundColor = '#FF4D4D';
      }
    } else {
      alert('주변 식당을 찾을 수 없습니다.');
      findBtn.disabled = false;
    }
  }, {
    location: new kakao.maps.LatLng(currentLat, currentLng),
    radius: 100,
    sort: kakao.maps.services.SortBy.DISTANCE // 거리순 정렬
  });
}

function error() {
    alert('위치 정보를 가져올 수 없습니다.');
    findBtn.disabled = false; // 위치 정보를 가져올 수 없는 경우 버튼 활성화
}

// navigate 버튼 클릭 이벤트 추가
navigateBtn.addEventListener('click', function() {
    if (selectedRestaurant && currentLat && currentLng) {
        try {
            // 카카오맵 앱으로 이동하는 URL 생성 (경로 안내)
            const appUrl = `kakaomap://route?ep=${encodeURIComponent(selectedRestaurant)}&ep_xy=${currentLng},${currentLat}`;
            // 카카오맵 웹 버전 URL 생성 (경로 안내)
            const webUrl = `https://map.kakao.com/link/route/${encodeURIComponent(selectedRestaurant)},${currentLat},${currentLng}`;
            
            // 앱 실행 시도
            const startTime = new Date().getTime();
            window.location.href = appUrl;
            
            // 앱이 실행되지 않으면 웹 버전으로 리다이렉트
            setTimeout(function() {
                const endTime = new Date().getTime();
                if (endTime - startTime < 2000) { // 2초 이내에 페이지가 유지되면 앱이 없는 것으로 판단
                    window.location.href = webUrl;
                }
            }, 2000);
        } catch (error) {
            alert('경로 안내를 시작할 수 없습니다. 다시 시도해주세요.');
            console.error('Navigation error:', error);
        }
    } else {
        alert('위치 정보가 없습니다. 식당을 다시 선택해주세요.');
    }
}); 