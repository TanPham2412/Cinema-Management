import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Film, Tag, Building2, Calendar, Users, Ticket, DollarSign, Settings } from 'lucide-react'
import api from '../../services/api'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/admin/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(() => {})
  }, [])
  const menuItems = [
    {
      title: 'Quản lý Phim',
      description: 'Thêm, sửa, xóa phim',
      icon: Film,
      link: '/admin/movies',
      color: 'from-cinema-red to-cinema-red-dark',
      iconBg: 'bg-cinema-red/20',
      iconColor: 'text-cinema-red'
    },
    {
      title: 'Quản lý Thể loại',
      description: 'Quản lý thể loại phim',
      icon: Tag,
      link: '/admin/genres',
      color: 'from-cinema-gold to-cinema-gold-dark',
      iconBg: 'bg-cinema-gold/20',
      iconColor: 'text-cinema-gold'
    },
    {
      title: 'Quản lý Rạp',
      description: 'Thêm, sửa rạp chiếu',
      icon: Building2,
      link: '/admin/cinemas',
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400'
    },
    {
      title: 'Quản lý Suất chiếu',
      description: 'Lập lịch chiếu phim',
      icon: Calendar,
      link: '/admin/screenings',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400'
    },
    {
      title: 'Quản lý Người dùng',
      description: 'Quản lý tài khoản',
      icon: Users,
      link: '/admin/users',
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400'
    },
    {
      title: 'Quản lý Đơn hàng',
      description: 'Xem đơn đặt vé',
      icon: Ticket,
      link: '/admin/bookings',
      color: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400'
    },
    {
      title: 'Báo cáo Doanh thu',
      description: 'Thống kê và báo cáo',
      icon: DollarSign,
      link: '/admin/revenue',
      color: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400'
    },
    {
      title: 'Cài đặt',
      description: 'Cấu hình hệ thống',
      icon: Settings,
      link: '/admin/settings',
      color: 'from-gray-500 to-gray-600',
      iconBg: 'bg-gray-500/20',
      iconColor: 'text-gray-400'
    }
  ]

  const statCards = [
    {
      label: 'Tổng doanh thu',
      value: stats ? stats.totalRevenue.toLocaleString('vi-VN') + 'đ' : '...',
      color: 'text-cinema-gold'
    },
    {
      label: 'Vé đã bán',
      value: stats ? stats.ticketsSold.toLocaleString() : '...',
      color: 'text-cinema-red'
    },
    {
      label: 'Phim đang chiếu',
      value: stats ? stats.nowShowingMovies.toString() : '...',
      color: 'text-blue-400'
    },
    {
      label: 'Rạp hoạt động',
      value: stats ? stats.activeCinemas.toString() : '...',
      color: 'text-purple-400'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-cinema-darker via-cinema-dark to-cinema-darker p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Chào mừng đến với trang quản trị hệ thống</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-cinema-gray-light/50 backdrop-blur-sm rounded-xl p-6 border border-cinema-gray-light"
            >
              <h3 className="text-sm font-medium text-gray-400 mb-2">{stat.label}</h3>
              <p className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={index}
                to={item.link}
                className="bg-cinema-gray-light/50 backdrop-blur-sm rounded-xl p-6 border border-cinema-gray-light hover:border-cinema-red transition-all duration-300 group"
              >
                <div className={`w-12 h-12 ${item.iconBg} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cinema-gold transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
