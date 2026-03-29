package Nhom5.cinema_management;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CinemaManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(CinemaManagementApplication.class, args);
	}

}
