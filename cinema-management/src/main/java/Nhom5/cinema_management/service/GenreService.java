package Nhom5.cinema_management.service;

import Nhom5.cinema_management.dto.GenreDTO;
import Nhom5.cinema_management.model.Genre;
import Nhom5.cinema_management.repository.GenreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GenreService {
    
    private final GenreRepository genreRepository;
    
    @Transactional(readOnly = true)
    public List<GenreDTO> getAllGenres() {
        return genreRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public GenreDTO getGenreById(Long id) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thể loại với ID: " + id));
        return convertToDTO(genre);
    }
    
    @Transactional
    public GenreDTO createGenre(GenreDTO genreDTO) {
        if (genreRepository.existsByName(genreDTO.getName())) {
            throw new RuntimeException("Thể loại đã tồn tại: " + genreDTO.getName());
        }
        
        Genre genre = Genre.builder()
                .name(genreDTO.getName())
                .description(genreDTO.getDescription())
                .slug(generateSlug(genreDTO.getName()))
                .build();
        
        Genre savedGenre = genreRepository.save(genre);
        return convertToDTO(savedGenre);
    }
    
    @Transactional
    public GenreDTO updateGenre(Long id, GenreDTO genreDTO) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thể loại với ID: " + id));
        
        // Check if name is being changed and if new name already exists
        if (!genre.getName().equals(genreDTO.getName()) && 
            genreRepository.existsByName(genreDTO.getName())) {
            throw new RuntimeException("Thể loại đã tồn tại: " + genreDTO.getName());
        }
        
        genre.setName(genreDTO.getName());
        genre.setDescription(genreDTO.getDescription());
        genre.setSlug(generateSlug(genreDTO.getName()));
        
        Genre updatedGenre = genreRepository.save(genre);
        return convertToDTO(updatedGenre);
    }
    
    @Transactional
    public void deleteGenre(Long id) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thể loại với ID: " + id));
        // Remove genre from movie_genres join table first, then delete
        genreRepository.deleteMovieGenresByGenreId(id);
        genreRepository.delete(genre);
    }
    
    private GenreDTO convertToDTO(Genre genre) {
        return GenreDTO.builder()
                .id(genre.getId())
                .name(genre.getName())
                .description(genre.getDescription())
                .slug(genre.getSlug())
                .build();
    }
    
    private String generateSlug(String name) {
        // Convert Vietnamese to ASCII and create URL-friendly slug
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD);
        String slug = normalized.replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("đ", "d")
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
        return slug;
    }
}
