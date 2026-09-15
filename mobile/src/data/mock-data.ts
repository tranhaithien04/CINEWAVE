import { Movie, Showtime, Seat, AdminBooking } from '../types';

export const mockMovies: Movie[] = [
  {
    id: 'm1',
    slug: 'dao-hai-tac',
    title: 'Đảo Hải Tặc: Red',
    description: 'Cuộc săn lùng kho báu cuối cùng kéo cả thế giới vào một trận hải chiến huyền thoại đầy kịch tính.',
    durationMin: 128,
    rating: 'P',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&h=900',
    backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
    genres: ['Hành động', 'Phiêu lưu', 'Hoạt hình'],
    nowShowing: true,
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    imdbRating: 8.8,
    imdbVotes: 14200,
    year: '2026',
    director: 'Gorō Taniguchi',
    actors: 'Mayumi Tanaka, Kaori Nazuka, Shuichi Ikeda',
  },
  {
    id: 'm2',
    slug: 'dem-ha-noi',
    title: 'Đêm Hà Nội',
    description: 'Một nhà báo điều tra lần theo manh mối mất tích bí ẩn giữa những con ngõ cổ kính của thủ đô.',
    durationMin: 112,
    rating: 'T13',
    posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&h=900',
    backdropUrl: 'https://images.unsplash.com/photo-1517604931442-73e72f77c3e9?auto=format&fit=crop&w=1600&q=80',
    genres: ['Tâm lý', 'Bí ẩn', 'Tội phạm'],
    nowShowing: true,
    imdbRating: 7.9,
    imdbVotes: 8900,
    year: '2026',
    director: 'Trần Vũ',
    actors: 'Thái Hòa, Kaity Nguyễn, Quang Tuấn',
  },
  {
    id: 'm3',
    slug: 'vung-toi',
    title: 'Vùng Tối Cyber',
    description: 'Cuộc chiến sinh tồn khốc liệt trong trạm vũ trụ ngoài rìa hệ Mặt Trời khi tín hiệu Trái Đất tắt lịm.',
    durationMin: 136,
    rating: 'T16',
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&h=900',
    backdropUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1600&q=80',
    genres: ['Khoa học viễn tưởng', 'Hồi hộp'],
    nowShowing: true,
    imdbRating: 8.4,
    imdbVotes: 21500,
    year: '2026',
    director: 'Christopher Nolan',
    actors: 'Cillian Murphy, Florence Pugh, John David Washington',
  },
  {
    id: 'm4',
    slug: 'khong-loi-thoat',
    title: 'Không Lối Thoát',
    description: 'Đêm mưa bão, tòa tháp tài chính bị phong tỏa bí mật, từng nạn nhân biến mất không dấu vết.',
    durationMin: 104,
    rating: 'T18',
    posterUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&h=900',
    backdropUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80',
    genres: ['Kinh dị', 'Giật gân'],
    nowShowing: true,
    imdbRating: 8.1,
    imdbVotes: 12000,
    year: '2026',
    director: 'James Wan',
    actors: 'Patrick Wilson, Vera Farmiga',
  },
  {
    id: 'm5',
    slug: 'mua-he-cuoi',
    title: 'Mùa Hè Rực Rỡ',
    description: 'Ba người bạn thân cùng nhau trở về thị trấn ven biển để thực hiện lời hứa thời niên thiếu.',
    durationMin: 118,
    rating: 'K',
    posterUrl: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=600&h=900',
    backdropUrl: 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=1600&q=80',
    genres: ['Gia đình', 'Tình cảm', 'Tuổi trẻ'],
    nowShowing: false,
    year: '2026',
    director: 'Nguyễn Quang Dũng',
    actors: 'Avin Lu, Hoàng Hà, Lan Thy',
  },
  {
    id: 'm6',
    slug: 'anh-sang-cuoi-cung',
    title: 'Ánh Sáng Cuối Cùng',
    description: 'Một nghệ sĩ dương cầm khiếm thị tình cờ lắng nghe giai điệu giải mã bí mật gia tộc.',
    durationMin: 124,
    rating: 'T13',
    posterUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=600&h=900',
    backdropUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1600&q=80',
    genres: ['Nhạc kịch', 'Tâm lý'],
    nowShowing: false,
    year: '2026',
    director: 'Damien Chazelle',
    actors: 'Ryan Gosling, Emma Stone',
  },
];

export const mockShowtimes: Showtime[] = [
  { id: 'st-1', movieSlug: 'dao-hai-tac', cinema: 'CineWave Landmark 81', room: 'IMAX Laser 01', startsAt: '2026-09-14T18:30:00+07:00', priceBase: 120000 },
  { id: 'st-2', movieSlug: 'dao-hai-tac', cinema: 'CineWave Landmark 81', room: 'IMAX Laser 01', startsAt: '2026-09-14T21:00:00+07:00', priceBase: 140000 },
  { id: 'st-3', movieSlug: 'dem-ha-noi', cinema: 'CineWave Vincom Center', room: 'Cyber Hall 3', startsAt: '2026-09-14T19:15:00+07:00', priceBase: 95000 },
  { id: 'st-4', movieSlug: 'vung-toi', cinema: 'CineWave Vincom Center', room: 'Cyber Hall 2', startsAt: '2026-09-14T20:00:00+07:00', priceBase: 110000 },
  { id: 'st-5', movieSlug: 'khong-loi-thoat', cinema: 'CineWave Landmark 81', room: 'Cyber Hall 5', startsAt: '2026-09-14T22:10:00+07:00', priceBase: 105000 },
  { id: 'st-6', movieSlug: 'dao-hai-tac', cinema: 'CineWave Landmark 81', room: 'IMAX Laser 01', startsAt: '2026-09-15T19:00:00+07:00', priceBase: 130000 },
  { id: 'st-7', movieSlug: 'dem-ha-noi', cinema: 'CineWave Vincom Center', room: 'Cyber Hall 3', startsAt: '2026-09-15T20:30:00+07:00', priceBase: 95000 },
];

export const mockTickets: AdminBooking[] = [
  {
    id: 'bk-1',
    code: 'CW-8921-X',
    userEmail: 'demo@cinewave.vn',
    movieSlug: 'dao-hai-tac',
    showtimeId: 'st-1',
    seats: ['F05', 'F06'],
    total: 280000,
    status: 'PAID',
    createdAt: '2026-09-14T10:30:00+07:00',
  },
  {
    id: 'bk-2',
    code: 'CW-4412-M',
    userEmail: 'demo@cinewave.vn',
    movieSlug: 'dem-ha-noi',
    showtimeId: 'st-3',
    seats: ['C08'],
    total: 95000,
    status: 'USED',
    createdAt: '2026-09-13T14:15:00+07:00',
  },
];

export function buildSeatMap(): Seat[] {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seatsPerRow = 10;
  const list: Seat[] = [];

  for (const row of rows) {
    for (let num = 1; num <= seatsPerRow; num++) {
      let type: Seat['type'] = 'STANDARD';
      if (row === 'E' || row === 'F') {
        type = 'VIP';
      } else if (row === 'H') {
        type = 'COUPLE';
      }

      let state: Seat['state'] = 'AVAILABLE';
      // Mock some occupied seats
      if ((row === 'C' && (num === 4 || num === 5)) || (row === 'F' && (num === 3 || num === 4))) {
        state = 'SOLD';
      }

      list.push({
        id: `${row}${num}`,
        row,
        number: num,
        type,
        state,
      });
    }
  }

  return list;
}

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function seatPrice(base: number, type: Seat['type']): number {
  if (type === 'VIP') return Math.round(base * 1.2);
  if (type === 'COUPLE') return Math.round(base * 1.8);
  return base;
}

