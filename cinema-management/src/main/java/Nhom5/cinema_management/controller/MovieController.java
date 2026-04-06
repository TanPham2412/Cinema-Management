package Nhom5.cinema_management.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import Nhom5.cinema_management.dto.MovieRequestDTO;
import Nhom5.cinema_management.dto.MovieResponseDTO;
import Nhom5.cinema_management.dto.MovieSearchDTO;
import Nhom5.cinema_management.service.FileStorageService;
import Nhom5.cinema_management.service.MovieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/movies")
@RequiredArgsConstructor
public class MovieController {
    
    private final MovieService movieService;
    private final FileStorageService fileStorageService;
    
    // Public endpoints - accessible by all users
    
    @GetMapping
    public ResponseEntity<Page<MovieResponseDTO>> getAllMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "releaseDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        return ResponseEntity.ok(movieService.getAllMovies(page, size, sortBy, sortDirection));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<MovieResponseDTO> getMovieById(@PathVariable Long id) {
        return ResponseEntity.ok(movieService.getMovieById(id));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<MovieResponseDTO> getMovieBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(movieService.getMovieBySlug(slug));
    }
    
    @GetMapping("/search")
    public ResponseEntity<Page<MovieResponseDTO>> searchMovies(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long genreId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String releaseDateFrom,
            @RequestParam(required = false) String releaseDateTo,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) String ageRating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "releaseDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        
        MovieSearchDTO searchDTO = MovieSearchDTO.builder()
                .keyword(keyword)
                .genreId(genreId)
                .status(status)
                .language(language)
                .minRating(minRating)
                .ageRating(ageRating)
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();
        
        return ResponseEntity.ok(movieService.searchMovies(searchDTO));
    }
    
    @GetMapping("/now-showing")
    public ResponseEntity<List<MovieResponseDTO>> getNowShowingMovies() {
        return ResponseEntity.ok(movieService.getNowShowingMovies());
    }
    
    @GetMapping("/upcoming")
    public ResponseEntity<List<MovieResponseDTO>> getUpcomingMovies() {
        return ResponseEntity.ok(movieService.getUpcomingMovies());
    }
    
    @GetMapping("/top-rated")
    public ResponseEntity<Page<MovieResponseDTO>> getTopRatedMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(movieService.getTopRatedMovies(page, size));
    }
    
    // Admin-only endpoints
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MovieResponseDTO> createMovie(@Valid @RequestBody MovieRequestDTO requestDTO) {
        MovieResponseDTO created = movieService.createMovie(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MovieResponseDTO> updateMovie(
            @PathVariable Long id,
            @Valid @RequestBody MovieRequestDTO requestDTO) {
        return ResponseEntity.ok(movieService.updateMovie(id, requestDTO));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMovie(@PathVariable Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }
    
    // File upload endpoints
    
    @PostMapping("/upload-poster")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> uploadPoster(@RequestParam("file") MultipartFile file) {
        String filePath = fileStorageService.storeFile(file, "posters");
        Map<String, String> response = new HashMap<>();
        response.put("url", "/uploads/movies" + filePath);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/upload-banner")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> uploadBanner(@RequestParam("file") MultipartFile file) {
        String filePath = fileStorageService.storeFile(file, "banners");
        Map<String, String> response = new HashMap<>();
        response.put("url", "/uploads/movies" + filePath);
        return ResponseEntity.ok(response);
    }
}
