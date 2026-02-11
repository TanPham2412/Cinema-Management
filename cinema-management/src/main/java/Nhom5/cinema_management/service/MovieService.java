package Nhom5.cinema_management.service;

import Nhom5.cinema_management.dto.GenreDTO;
import Nhom5.cinema_management.dto.MovieRequestDTO;
import Nhom5.cinema_management.dto.MovieResponseDTO;
import Nhom5.cinema_management.dto.MovieSearchDTO;
import Nhom5.cinema_management.model.Genre;
import Nhom5.cinema_management.model.Movie;
import Nhom5.cinema_management.repository.GenreRepository;
import Nhom5.cinema_management.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovieService {
    
    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;
    
    @Transactional(readOnly = true)
    public Page<MovieResponseDTO> getAllMovies(int page, int size, String sortBy, String sortDirection) {
        Sort sort = sortDirection.equalsIgnoreCase("ASC") ? 
                   Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        return movieRepository.findAll(pageable)
                .map(this::convertToResponseDTO);
    }
    
    @Transactional(readOnly = true)
    public MovieResponseDTO getMovieById(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phim với ID: " + id));
        return convertToResponseDTO(movie);
    }
    
    @Transactional(readOnly = true)
    public Page<MovieResponseDTO> searchMovies(MovieSearchDTO searchDTO) {
        Specification<Movie> spec = createSpecification(searchDTO);
        
        Sort sort = searchDTO.getSortDirection().equalsIgnoreCase("ASC") ? 
                   Sort.by(searchDTO.getSortBy()).ascending() : 
                   Sort.by(searchDTO.getSortBy()).descending();
        
        Pageable pageable = PageRequest.of(
            searchDTO.getPage(), 
            searchDTO.getSize(), 
            sort
        );
        
        return movieRepository.findAll(spec, pageable)
                .map(this::convertToResponseDTO);
    }
    
    @Transactional(readOnly = true)
    public List<MovieResponseDTO> getNowShowingMovies() {
        return movieRepository.findNowShowingMovies().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<MovieResponseDTO> getUpcomingMovies() {
        return movieRepository.findUpcomingMovies(LocalDate.now()).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Page<MovieResponseDTO> getTopRatedMovies(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return movieRepository.findTopRatedMovies(pageable)
                .map(this::convertToResponseDTO);
    }
    
    @Transactional
    public MovieResponseDTO createMovie(MovieRequestDTO requestDTO) {
        // Validate and get genres
        Set<Genre> genres = validateAndGetGenres(requestDTO.getGenreIds());
        
        Movie movie = Movie.builder()
                .title(requestDTO.getTitle())
                .description(requestDTO.getDescription())
                .director(requestDTO.getDirector())
                .cast(requestDTO.getCast())
                .duration(requestDTO.getDuration())
                .genres(genres)
                .language(requestDTO.getLanguage())
                .country(requestDTO.getCountry())
                .releaseDate(requestDTO.getReleaseDate())
                .posterUrl(requestDTO.getPosterUrl())
                .trailerUrl(requestDTO.getTrailerUrl())
                .bannerUrl(requestDTO.getBannerUrl())
                .ageRating(requestDTO.getAgeRating())
                .status(Movie.MovieStatus.valueOf(requestDTO.getStatus()))
                .build();
        
        Movie savedMovie = movieRepository.save(movie);
        return convertToResponseDTO(savedMovie);
    }
    
    @Transactional
    public MovieResponseDTO updateMovie(Long id, MovieRequestDTO requestDTO) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phim với ID: " + id));
        
        // Validate and get genres
        Set<Genre> genres = validateAndGetGenres(requestDTO.getGenreIds());
        
        movie.setTitle(requestDTO.getTitle());
        movie.setDescription(requestDTO.getDescription());
        movie.setDirector(requestDTO.getDirector());
        movie.setCast(requestDTO.getCast());
        movie.setDuration(requestDTO.getDuration());
        movie.setGenres(genres);
        movie.setLanguage(requestDTO.getLanguage());
        movie.setCountry(requestDTO.getCountry());
        movie.setReleaseDate(requestDTO.getReleaseDate());
        movie.setPosterUrl(requestDTO.getPosterUrl());
        movie.setTrailerUrl(requestDTO.getTrailerUrl());
        movie.setBannerUrl(requestDTO.getBannerUrl());
        movie.setAgeRating(requestDTO.getAgeRating());
        movie.setStatus(Movie.MovieStatus.valueOf(requestDTO.getStatus()));
        
        Movie updatedMovie = movieRepository.save(movie);
        return convertToResponseDTO(updatedMovie);
    }
    
    @Transactional
    public void deleteMovie(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phim với ID: " + id));
        
        // Check if movie has screenings
        if (movie.getScreenings() != null && !movie.getScreenings().isEmpty()) {
            throw new RuntimeException("Không thể xóa phim đang có suất chiếu. Vui lòng xóa các suất chiếu trước.");
        }
        
        movieRepository.delete(movie);
    }
    
    private Set<Genre> validateAndGetGenres(Set<Long> genreIds) {
        if (genreIds == null || genreIds.isEmpty()) {
            throw new RuntimeException("Phim phải có ít nhất 1 thể loại");
        }
        
        Set<Genre> genres = new HashSet<>();
        for (Long genreId : genreIds) {
            Genre genre = genreRepository.findById(genreId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thể loại với ID: " + genreId));
            genres.add(genre);
        }
        
        return genres;
    }
    
    private Specification<Movie> createSpecification(MovieSearchDTO searchDTO) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Keyword search (title, director, cast)
            if (searchDTO.getKeyword() != null && !searchDTO.getKeyword().isEmpty()) {
                String keyword = "%" + searchDTO.getKeyword().toLowerCase() + "%";
                Predicate titlePredicate = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("title")), keyword);
                Predicate directorPredicate = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("director")), keyword);
                Predicate castPredicate = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("cast")), keyword);
                
                predicates.add(criteriaBuilder.or(titlePredicate, directorPredicate, castPredicate));
            }
            
            // Status filter
            if (searchDTO.getStatus() != null && !searchDTO.getStatus().isEmpty()) {
                predicates.add(criteriaBuilder.equal(
                    root.get("status"), Movie.MovieStatus.valueOf(searchDTO.getStatus())));
            }
            
            // Genre filter
            if (searchDTO.getGenreId() != null) {
                Join<Movie, Genre> genreJoin = root.join("genres");
                predicates.add(criteriaBuilder.equal(genreJoin.get("id"), searchDTO.getGenreId()));
            }
            
            // Language filter
            if (searchDTO.getLanguage() != null && !searchDTO.getLanguage().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("language"), searchDTO.getLanguage()));
            }
            
            // Release date range
            if (searchDTO.getReleaseDateFrom() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                    root.get("releaseDate"), searchDTO.getReleaseDateFrom()));
            }
            if (searchDTO.getReleaseDateTo() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                    root.get("releaseDate"), searchDTO.getReleaseDateTo()));
            }
            
            // Min rating filter
            if (searchDTO.getMinRating() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                    root.get("rating"), searchDTO.getMinRating()));
            }
            
            // Age rating filter
            if (searchDTO.getAgeRating() != null && !searchDTO.getAgeRating().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("ageRating"), searchDTO.getAgeRating()));
            }
            
            query.distinct(true);
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    private MovieResponseDTO convertToResponseDTO(Movie movie) {
        Set<GenreDTO> genreDTOs = movie.getGenres().stream()
                .map(genre -> GenreDTO.builder()
                        .id(genre.getId())
                        .name(genre.getName())
                        .description(genre.getDescription())
                        .slug(genre.getSlug())
                        .build())
                .collect(Collectors.toSet());
        
        return MovieResponseDTO.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .description(movie.getDescription())
                .director(movie.getDirector())
                .cast(movie.getCast())
                .duration(movie.getDuration())
                .genres(genreDTOs)
                .language(movie.getLanguage())
                .country(movie.getCountry())
                .releaseDate(movie.getReleaseDate())
                .posterUrl(movie.getPosterUrl())
                .trailerUrl(movie.getTrailerUrl())
                .bannerUrl(movie.getBannerUrl())
                .rating(movie.getRating())
                .ageRating(movie.getAgeRating())
                .status(movie.getStatus().name())
                .createdAt(movie.getCreatedAt())
                .updatedAt(movie.getUpdatedAt())
                .build();
    }
}
