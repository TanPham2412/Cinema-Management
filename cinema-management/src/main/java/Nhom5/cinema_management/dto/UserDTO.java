package Nhom5.cinema_management.dto;

import Nhom5.cinema_management.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String role;
    private Integer loyaltyPoints;
    private String membershipTier;
    
    public static UserDTO fromEntity(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole().name())
                .loyaltyPoints(user.getLoyaltyPoints())
                .membershipTier(user.getMembershipTier().name())
                .build();
    }
}
