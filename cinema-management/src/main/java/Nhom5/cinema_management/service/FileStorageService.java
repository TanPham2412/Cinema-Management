package Nhom5.cinema_management.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {
    
    @Value("${file.upload-dir:uploads/movies}")
    private String uploadDir;
    
    public String storeFile(MultipartFile file, String fileType) {
        try {
            // Validate file
            if (file.isEmpty()) {
                throw new RuntimeException("File trống, vui lòng chọn file khác");
            }
            
            // Get original filename
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            
            // Validate file extension
            String fileExtension = getFileExtension(originalFilename);
            if (!isValidImageExtension(fileExtension)) {
                throw new RuntimeException("Chỉ chấp nhận file ảnh: jpg, jpeg, png, gif, webp");
            }
            
            // Generate unique filename
            String fileName = UUID.randomUUID().toString() + "." + fileExtension;
            
            // Create directory structure based on file type
            String subDir = fileType != null ? fileType : "others";
            Path uploadPath = Paths.get(uploadDir, subDir);
            
            // Create directories if not exist
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // Copy file to target location
            Path targetLocation = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            // Return relative path (will be used to construct URL)
            return "/" + subDir + "/" + fileName;
            
        } catch (IOException ex) {
            throw new RuntimeException("Không thể lưu file. Vui lòng thử lại!", ex);
        }
    }
    
    public void deleteFile(String filePath) {
        try {
            if (filePath == null || filePath.isEmpty()) {
                return;
            }
            
            // Remove leading slash if present
            String cleanPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
            
            Path fileToDelete = Paths.get(uploadDir).resolve(cleanPath);
            Files.deleteIfExists(fileToDelete);
            
        } catch (IOException ex) {
            throw new RuntimeException("Không thể xóa file: " + filePath, ex);
        }
    }
    
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }
        
        return filename.substring(lastDotIndex + 1).toLowerCase();
    }
    
    private boolean isValidImageExtension(String extension) {
        String[] validExtensions = {"jpg", "jpeg", "png", "gif", "webp"};
        for (String validExt : validExtensions) {
            if (validExt.equalsIgnoreCase(extension)) {
                return true;
            }
        }
        return false;
    }
}
