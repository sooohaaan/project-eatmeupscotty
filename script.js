let menuItems = [];
const DEFAULT_SECTOR_COUNT = 10;

const sectorAngle = 360 / menuItems.length;
const roulette = document.getElementById('roulette');
const startButton = document.getElementById('start');
const result = document.getElementById('result');
const ticketsDisplay = document.getElementById('tickets');
const tickSound = document.getElementById('tickSound');

let tickets = 3;
let lastUpdate = localStorage.getItem('lastUpdatedDate');
let currentRotation = 0; // 전역 변수로 추가

// 카카오맵 API 초기화
let map = null;
let ps = null;

// 공휴일 목록 (2024년)
const HOLIDAYS_2024 = [
    '2024-01-01', // 신정
    '2024-02-09', // 설날
    '2024-02-10', // 설날
    '2024-02-11', // 설날
    '2024-02-12', // 대체공휴일
    '2024-03-01', // 삼일절
    '2024-04-10', // 국회의원선거일
    '2024-05-05', // 어린이날
    '2024-05-06', // 대체공휴일
    '2024-05-15', // 부처님오신날
    '2024-06-06', // 현충일
    '2024-08-15', // 광복절
    '2024-09-16', // 추석
    '2024-09-17', // 추석
    '2024-09-18', // 추석
    '2024-10-03', // 개천절
    '2024-10-09', // 한글날
    '2024-12-25'  // 성탄절
];

// 카카오맵 API 초기화 함수
function initKakaoMap() {
    try {
        // Places 서비스 초기화
        ps = new kakao.maps.services.Places();
        return true;
    } catch (error) {
        console.error('Failed to initialize Kakao Map:', error);
        return false;
    }
}

// 카카오맵 API 스크립트 로드 완료 후 초기화
function kakaoMapInit() {
    if (typeof kakao === 'undefined') {
        console.error('Kakao Map API is not loaded');
        return false;
    }

    if (initKakaoMap()) {
        console.log('Kakao Map API initialized successfully');
        return true;
    } else {
        console.error('Failed to initialize Kakao Map');
        return false;
    }
}

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
}

function updateTicketDisplay() {
    const totalTickets = 3;
    const ticketsElement = document.getElementById('tickets');
    const totalTicketsElement = document.getElementById('total-tickets');
    
    ticketsElement.innerText = tickets;
    totalTicketsElement.innerText = totalTickets;
    
    // tickets가 0 이하일 때는 항상 비활성화
    if (tickets <= 0) {
        startButton.disabled = true;
    }
    // tickets가 0보다 크더라도 기본적으로는 비활성화 상태 유지
    // success 함수에서 식당 정보를 성공적으로 불러왔을 때만 활성화
}

function updateStartButtonState() {
    // 인라인 스타일 초기화 (혹시 남아있을 수 있는 인라인 스타일 제거)
    startButton.style.backgroundColor = '';
    startButton.style.color = '';
    startButton.style.opacity = '';
    startButton.style.cursor = '';
    navigateBtn.style.backgroundColor = '';
    navigateBtn.style.color = '';
    navigateBtn.style.opacity = '';
    navigateBtn.style.cursor = '';

    if (tickets > 0 && menuItems && menuItems.length > 0 && !isSpinning) {
        startButton.disabled = false;
        startButton.classList.remove('disabled');
        navigateBtn.disabled = false;
        navigateBtn.classList.remove('disabled');
    } else {
        startButton.disabled = true;
        startButton.classList.add('disabled');
        navigateBtn.disabled = true;
        navigateBtn.classList.add('disabled');
    }
}

function createRoulette() {
    const svg = document.getElementById('roulette');
    svg.innerHTML = '';
    const cx = 160, cy = 160, r = 150;
    const items = (menuItems && menuItems.length > 0)
        ? menuItems.map(item => item.name)
        : Array(DEFAULT_SECTOR_COUNT).fill('');
    const sectorAngle = 360 / items.length;
    items.forEach((item, i) => {
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
        text.setAttribute('font-size', '11');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', '#363636');
        text.setAttribute('class', 'roulette-label');
        
        // 텍스트 길이 제한 및 줄바꿈 설정
        const textPathLength = r * 0.6;
        text.setAttribute('textLength', textPathLength);
        text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        
        // 긴 텍스트의 경우 줄바꿈 처리
        if (item && item.length > 10) {
            // 첫번째 줄 (앞부분)
            const tspan1 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan1.setAttribute('x', tx);
            tspan1.setAttribute('dy', '-0.6em');
            tspan1.textContent = item.substring(0, 10);
            text.appendChild(tspan1);
            
            // 두번째 줄 (뒷부분)
            const tspan2 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan2.setAttribute('x', tx);
            tspan2.setAttribute('dy', '1.2em');
            tspan2.textContent = item.substring(10);
            text.appendChild(tspan2);
        } else {
            // 짧은 텍스트는 그대로 표시
            text.textContent = item;
        }
        
        text.setAttribute('transform', `rotate(${textAngle},${tx},${ty})`);
        svg.appendChild(text);
    });

    // 정가운데 회색 원 추가
    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerCircle.setAttribute('cx', cx);
    centerCircle.setAttribute('cy', cy);
    centerCircle.setAttribute('r', 24);
    centerCircle.setAttribute('fill', '#aaaaaa');
    svg.appendChild(centerCircle);
    
    // 정가운데 작은 검은색 원 추가
    const centerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerDot.setAttribute('cx', cx);
    centerDot.setAttribute('cy', cy);
    centerDot.setAttribute('r', 4);
    centerDot.setAttribute('fill', '#000000');
    svg.appendChild(centerDot);

    // 외곽 1px 검은색 원 추가
    const borderCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    borderCircle.setAttribute('cx', cx);
    borderCircle.setAttribute('cy', cy);
    borderCircle.setAttribute('r', r);
    borderCircle.setAttribute('fill', 'none');
    borderCircle.setAttribute('stroke', '#363636');
    borderCircle.setAttribute('stroke-width', '1');
    svg.appendChild(borderCircle);
}

function playTick() {
    tickSound.currentTime = 0;
    tickSound.play();
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}

let isSpinning = false;

function spinRoulette() {
    if (tickets <= 0) {
        alert("오늘의 이용권을 모두 사용했습니다!");
        return;
    }
    if (!menuItems || menuItems.length === 0) {
        alert("음식점 목록이 없습니다. 먼저 음식점을 불러와주세요.");
        return;
    }
    if (isSpinning) return; // 이미 회전 중이면 무시
    isSpinning = true;
    updateStartButtonState();

    // 티켓 차감 및 표시
    tickets--;
    localStorage.setItem('rouletteTickets', tickets);
    updateTicketDisplay();
    updateStartButtonState(); // 티켓 차감 후 상태 갱신
    
    // result 영역 초기화
    result.innerText = '';

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
        selectedRestaurant = menuItems[randomSector]; // 선택된 식당 객체 저장
        result.innerText = selectedRestaurant.name;
        
        isSpinning = false;
        updateStartButtonState();
        
        // 식당이 선택되면 navigate 버튼 활성화
        navigateBtn.disabled = false;
    }, 4000);
}

startButton.addEventListener('click', spinRoulette);

createRoulette();
initTickets();

const findBtn = document.getElementById('find-restaurants');
const countdownElement = document.getElementById('countdown');
const navigateBtn = document.getElementById('navigate');
let selectedRestaurant = null;
let currentLat = null; // 현재 위도
let currentLng = null; // 현재 경도

// navigate 버튼 초기 상태 설정
navigateBtn.disabled = true;

countdownElement.textContent = '5'; // 페이지 로드 시 기본값 설정

findBtn.addEventListener('click', function() {
    findBtn.disabled = true;
    findBtn.classList.add('disabled');
    let countdown = 5;

    countdownElement.textContent = countdown;

    const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            countdownElement.textContent = '5';
            findBtn.disabled = false;
            findBtn.classList.remove('disabled');
        }
    }, 1000);

    // 위치 정보 요청
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                // 위치 정보를 성공적으로 가져왔더라도 카운트다운이 끝날 때까지 버튼은 비활성화 상태 유지
                success(position);
            },
            function(err) {
                // 위치 정보를 가져오는데 실패했더라도 카운트다운이 끝날 때까지 버튼은 비활성화 상태 유지
                error(err);
            }
        );
    } else {
        alert('이 브라우저에서는 위치 정보가 지원되지 않습니다.');
        // 브라우저가 위치 정보를 지원하지 않는 경우에도 카운트다운이 끝날 때까지 버튼은 비활성화 상태 유지
    }
});

// 영업시간 파싱 함수
function parseBusinessHours(businessHours, currentDay, currentTime) {
    if (!businessHours) return true;

    // 휴무일 체크
    if (businessHours.includes('휴무') || businessHours.includes('정기휴무')) {
        return false;
    }

    // 요일별 영업시간 파싱
    const dayPatterns = {
        0: ['일', '일요일', '휴무'],
        1: ['월', '월요일'],
        2: ['화', '화요일'],
        3: ['수', '수요일'],
        4: ['목', '목요일'],
        5: ['금', '금요일'],
        6: ['토', '토요일']
    };

    // 현재 요일에 해당하는 영업시간 찾기
    const currentDayPatterns = dayPatterns[currentDay];
    const hasDaySpecificHours = currentDayPatterns.some(pattern => 
        businessHours.includes(pattern)
    );

    // 요일별 영업시간이 있는 경우
    if (hasDaySpecificHours) {
        const dayHours = businessHours.split(',').find(part => 
            currentDayPatterns.some(pattern => part.includes(pattern))
        );

        if (dayHours) {
            // 휴무 체크
            if (dayHours.includes('휴무')) return false;

            // 영업시간 파싱
            const timeMatch = dayHours.match(/(\d{1,2}:\d{2})~(\d{1,2}:\d{2})/);
            if (timeMatch) {
                const [_, openTime, closeTime] = timeMatch;
                const [openHour, openMinute] = openTime.split(':').map(Number);
                const [closeHour, closeMinute] = closeTime.split(':').map(Number);
                
                const openMinutes = openHour * 60 + openMinute;
                const closeMinutes = closeHour * 60 + closeMinute;

                // 점심시간 휴무 체크
                if (businessHours.includes('점심시간')) {
                    const lunchMatch = businessHours.match(/점심시간\s*(\d{1,2}:\d{2})~(\d{1,2}:\d{2})/);
                    if (lunchMatch) {
                        const [_, lunchStart, lunchEnd] = lunchMatch;
                        const [lunchStartHour, lunchStartMinute] = lunchStart.split(':').map(Number);
                        const [lunchEndHour, lunchEndMinute] = lunchEnd.split(':').map(Number);
                        
                        const lunchStartMinutes = lunchStartHour * 60 + lunchStartMinute;
                        const lunchEndMinutes = lunchEndHour * 60 + lunchEndMinute;

                        // 현재 시간이 점심시간 휴무 시간대인지 확인
                        if (currentTime >= lunchStartMinutes && currentTime <= lunchEndMinutes) {
                            return false;
                        }
                    }
                }

                return currentTime >= openMinutes && currentTime <= closeMinutes;
            }
        }
    }

    // 일반 영업시간 파싱 (요일별 정보가 없는 경우)
    const timeMatch = businessHours.match(/(\d{1,2}:\d{2})~(\d{1,2}:\d{2})/);
    if (timeMatch) {
        const [_, openTime, closeTime] = timeMatch;
        const [openHour, openMinute] = openTime.split(':').map(Number);
        const [closeHour, closeMinute] = closeTime.split(':').map(Number);
        
        const openMinutes = openHour * 60 + openMinute;
        const closeMinutes = closeHour * 60 + closeMinute;

        // 24시간 영업 체크
        if (openMinutes === 0 && closeMinutes === 1440) return true;

        return currentTime >= openMinutes && currentTime <= closeMinutes;
    }

    return true; // 파싱 실패 시 기본적으로 포함
}

function success(position) {
    currentLat = position.coords.latitude;
    currentLng = position.coords.longitude;
    console.log('Current location:', currentLat, currentLng);

    // Places 서비스가 초기화되지 않은 경우
    if (!ps) {
        try {
            ps = new kakao.maps.services.Places();
            console.log('Places service initialized');
        } catch (error) {
            console.error('Failed to initialize Places service:', error);
            alert('카카오맵 서비스를 초기화할 수 없습니다. 페이지를 새로고침해주세요.');
            menuItems = [];
            createRoulette();
            updateStartButtonState();
            return;
        }
    }

    // 음식점 카테고리(FD6), 반경 100m, 최대 10개
    const searchOptions = {
        location: new kakao.maps.LatLng(currentLat, currentLng),
        radius: 100,
        sort: kakao.maps.services.SortBy.DISTANCE
    };
    console.log('Search options:', searchOptions);

    ps.categorySearch('FD6', function(data, status) {
        console.log('Search status:', status);
        console.log('Search results:', data);

        if (status === kakao.maps.services.Status.OK) {
            const menuList = document.getElementById('roulette-menu');
            menuList.innerHTML = ''; // 기존 목록 초기화

            // 현재 시간 기준으로 영업 중인 식당만 필터링
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = currentHour * 60 + currentMinute;
            const currentDay = now.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일

            // 공휴일 체크
            const today = now.toISOString().split('T')[0];
            const isHoliday = HOLIDAYS_2024.includes(today);

            const openRestaurants = data.filter(place => {
                try {
                    // 공휴일 영업시간 체크
                    if (isHoliday && place.business_hours) {
                        if (place.business_hours.includes('공휴일') || place.business_hours.includes('휴무')) {
                            return false;
                        }
                    }

                    return parseBusinessHours(place.business_hours, currentDay, currentTime);
                } catch (error) {
                    console.error('영업시간 파싱 오류:', error);
                    return true; // 파싱 오류 시 기본적으로 포함
                }
            });

            console.log('Open restaurants:', openRestaurants);

            // 최대 10개만 표시, name/lat/lng 객체로 저장
            menuItems = openRestaurants.slice(0, 10).map(place => ({
                name: place.place_name,
                lat: place.y,
                lng: place.x
            }));
            
            if (menuItems.length === 0) {
                alert('현재 영업 중인 식당이 없습니다.');
                menuItems = [];
                createRoulette();
                updateStartButtonState();
                return;
            }

            createRoulette();
            updateStartButtonState();
        } else {
            console.error('Places search failed:', status);
            if (status === kakao.maps.services.Status.ZERO_RESULT) {
                alert('주변에 식당이 없습니다.');
            } else if (status === kakao.maps.services.Status.ERROR) {
                alert('검색 중 오류가 발생했습니다. 다시 시도해주세요.');
            } else {
                alert('주변 식당을 찾을 수 없습니다. 다시 시도해주세요.');
            }
            menuItems = [];
            createRoulette();
            updateStartButtonState();
        }
    }, searchOptions);
}

function error(err) {
    console.error('Geolocation error:', err);
    alert('위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.');
}

// navigate 버튼 클릭 이벤트 추가
navigateBtn.addEventListener('click', function() {
    if (selectedRestaurant && selectedRestaurant.lat && selectedRestaurant.lng) {
        try {
            // 카카오맵 앱에서 경로 안내
            const appUrl = `kakaomap://route?sp=내위치&ep=${selectedRestaurant.lat},${selectedRestaurant.lng}&by=FOOT`;
            // 카카오맵 웹 버전 URL
            const webUrl = `https://map.kakao.com/?sName=내위치&eName=${encodeURIComponent(selectedRestaurant.name)}&eX=${selectedRestaurant.lng}&eY=${selectedRestaurant.lat}`;
            
            // 앱 실행 시도
            const startTime = new Date().getTime();
            window.location.href = appUrl;
            
            // 앱이 실행되지 않으면 웹 버전으로 리다이렉트
            setTimeout(function() {
                const endTime = new Date().getTime();
                if (endTime - startTime < 2000) {
                    window.location.href = webUrl;
                }
            }, 2000);
        } catch (error) {
            alert('경로 안내를 시작할 수 없습니다. 다시 시도해주세요.');
            console.error('Navigation error:', error);
        }
    } else {
        alert('위치 정보가 없습니다. 식당을 선택해주세요.');
    }
});

window.kakaoMapAppInit = function() {
    try {
        ps = new kakao.maps.services.Places();
        console.log('Places service initialized (AppInit)');
    } catch (error) {
        console.error('Failed to initialize Places service in AppInit:', error);
    }
    createRoulette();
    initTickets();
    // 기타 필요한 초기화 코드가 있다면 여기에 추가
}; 