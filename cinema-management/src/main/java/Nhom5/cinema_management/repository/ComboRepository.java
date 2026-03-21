package Nhom5.cinema_management.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import Nhom5.cinema_management.model.Combo;

public interface ComboRepository extends JpaRepository<Combo, Long> {
    List<Combo> findByAvailableTrue();
}
