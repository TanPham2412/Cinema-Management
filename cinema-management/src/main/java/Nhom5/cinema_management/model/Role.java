package Nhom5.cinema_management.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    public static final Long ADMIN_ID = 57L;
    public static final Long CUSTOMER_ID = 22L;
    public static final Long STAFF_ID = 73L;

    @Id
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String name;
}
