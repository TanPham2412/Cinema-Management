import api from './api'

const getAvailableCombos = async () => {
  const response = await api.get('/combos')
  return response.data
}

const getAllCombos = async () => {
  const response = await api.get('/combos/admin')
  return response.data
}

const createCombo = async (data) => {
  const response = await api.post('/combos/admin', data)
  return response.data
}

const updateCombo = async (id, data) => {
  const response = await api.put(`/combos/admin/${id}`, data)
  return response.data
}

const deleteCombo = async (id) => {
  await api.delete(`/combos/admin/${id}`)
}

const comboService = {
  getAvailableCombos,
  getAllCombos,
  createCombo,
  updateCombo,
  deleteCombo,
}

export default comboService
