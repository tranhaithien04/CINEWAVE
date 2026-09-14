import { api } from './client';
import { AdminBooking, Movie, Showtime } from '../types';

export type AdminOverview = {
  movies: number;
  showtimes: number;
  bookings: number;
  tickets: number;
  users: number;
  revenue: number;
};

export type RevenueReport = {
  total: number;
  byMovie: Array<{ movieSlug: string; total: number; title?: string }>;
};

export type AdminUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  createdAt: string;
};

export async function fetchAdminOverview(): Promise<AdminOverview> {
  try {
    return await api<AdminOverview>('/admin/overview');
  } catch {
    return {
      movies: 6,
      showtimes: 7,
      bookings: 28,
      tickets: 45,
      users: 152,
      revenue: 8450000,
    };
  }
}

export async function fetchAdminRevenue(): Promise<RevenueReport> {
  try {
    return await api<RevenueReport>('/admin/revenue');
  } catch {
    return {
      total: 8450000,
      byMovie: [
        { movieSlug: 'dao-hai-tac', title: 'Đảo Hải Tặc: Red', total: 4500000 },
        { movieSlug: 'vung-toi', title: 'Vùng Tối Cyber', total: 2200000 },
        { movieSlug: 'dem-ha-noi', title: 'Đêm Hà Nội', total: 1750000 },
      ],
    };
  }
}

export async function fetchAdminBookings(): Promise<AdminBooking[]> {
  try {
    const res = await api<{ bookings: AdminBooking[] }>('/admin/bookings');
    return res.bookings;
  } catch {
    return [];
  }
}

export async function cancelAdminBooking(id: string): Promise<void> {
  await api(`/admin/bookings/${id}/cancel`, { method: 'POST' });
}

export async function refundAdminBooking(id: string): Promise<void> {
  await api(`/admin/bookings/${id}/refund`, { method: 'POST' });
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  try {
    const res = await api<{ users: AdminUser[] }>('/admin/users');
    return res.users;
  } catch {
    return [
      { id: 'u1', email: 'demo@cinewave.vn', fullName: 'Khách Hàng Demo', role: 'CUSTOMER', createdAt: new Date().toISOString() },
      { id: 'u2', email: 'admin@cinewave.vn', fullName: 'Quản Trị Viên CineWave', role: 'ADMIN', createdAt: new Date().toISOString() },
    ];
  }
}

export async function updateUserRole(userId: string, role: 'CUSTOMER' | 'ADMIN'): Promise<void> {
  await api(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: { role },
  });
}

export async function createMovie(movieData: Partial<Movie>): Promise<Movie> {
  const res = await api<{ movie: Movie }>('/admin/movies', {
    method: 'POST',
    body: movieData,
  });
  return res.movie;
}

export async function deleteMovie(id: string): Promise<void> {
  await api(`/admin/movies/${id}`, { method: 'DELETE' });
}

export async function createShowtime(showtimeData: Partial<Showtime>): Promise<Showtime> {
  const res = await api<{ showtime: Showtime }>('/admin/showtimes', {
    method: 'POST',
    body: showtimeData,
  });
  return res.showtime;
}

export async function deleteShowtime(id: string): Promise<void> {
  await api(`/admin/showtimes/${id}`, { method: 'DELETE' });
}

