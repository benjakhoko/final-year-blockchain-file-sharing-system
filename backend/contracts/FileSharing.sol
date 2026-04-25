// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FileSharing {
    address public owner;
    uint256 public fileCounter;
    
    enum AccessType { View, Download, Full }
    
    struct File {
        uint256 id;
        string fileHash;
        string fileName;
        uint256 fileSize;
        address owner;
        uint256 timestamp;
        bool isActive;
        bool isPublic;
    }
    
    struct SharedFile {
        uint256 fileId;
        address sharedWith;
        AccessType accessType;
        uint256 sharedAt;
        bool isActive;
    }
    
    struct AccessLog {
        uint256 fileId;
        address user;
        string action;
        uint256 timestamp;
    }
    
    mapping(uint256 => File) public files;
    mapping(uint256 => mapping(address => SharedFile)) public sharedFiles;
    mapping(uint256 => address[]) public fileSharedWith;
    mapping(address => uint256[]) public userFiles;
    mapping(uint256 => AccessLog[]) public fileAccessLogs;
    
    event FileUploaded(uint256 indexed fileId, string fileHash, address indexed owner, string fileName, uint256 timestamp);
    event FileShared(uint256 indexed fileId, address indexed owner, address indexed sharedWith, AccessType accessType);
    event AccessRevoked(uint256 indexed fileId, address indexed owner, address indexed revokedFrom);
    event FileAccessed(uint256 indexed fileId, address indexed user, string action);
    event FileDeleted(uint256 indexed fileId, address indexed owner);
    event FileStatusChanged(uint256 indexed fileId, bool isActive);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this function");
        _;
    }
    
    modifier fileExists(uint256 _fileId) {
        require(files[_fileId].timestamp != 0, "File does not exist");
        _;
    }
    
    modifier onlyFileOwner(uint256 _fileId) {
        require(files[_fileId].owner == msg.sender, "Only file owner can perform this action");
        _;
    }
    
    modifier hasAccess(uint256 _fileId) {
        require(
            files[_fileId].owner == msg.sender || 
            files[_fileId].isPublic || 
            (sharedFiles[_fileId][msg.sender].isActive && sharedFiles[_fileId][msg.sender].sharedAt > 0),
            "You don't have access to this file"
        );
        _;
    }
    
    constructor() {
        owner = msg.sender;
        fileCounter = 0;
    }
    
    function uploadFile(
        string memory _fileHash,
        string memory _fileName,
        uint256 _fileSize,
        bool _isPublic
    ) public returns (uint256) {
        fileCounter++;
        
        files[fileCounter] = File({
            id: fileCounter,
            fileHash: _fileHash,
            fileName: _fileName,
            fileSize: _fileSize,
            owner: msg.sender,
            timestamp: block.timestamp,
            isActive: true,
            isPublic: _isPublic
        });
        
        userFiles[msg.sender].push(fileCounter);
        
        emit FileUploaded(fileCounter, _fileHash, msg.sender, _fileName, block.timestamp);
        
        return fileCounter;
    }
    
    function shareFile(
        uint256 _fileId,
        address _sharedWith,
        AccessType _accessType
    ) public fileExists(_fileId) onlyFileOwner(_fileId) {
        require(_sharedWith != address(0), "Invalid address");
        require(_sharedWith != msg.sender, "Cannot share with yourself");
        require(!sharedFiles[_fileId][_sharedWith].isActive, "File already shared with this user");
        
        sharedFiles[_fileId][_sharedWith] = SharedFile({
            fileId: _fileId,
            sharedWith: _sharedWith,
            accessType: _accessType,
            sharedAt: block.timestamp,
            isActive: true
        });
        
        fileSharedWith[_fileId].push(_sharedWith);
        
        emit FileShared(_fileId, msg.sender, _sharedWith, _accessType);
    }
    
    function revokeAccess(
        uint256 _fileId,
        address _user
    ) public fileExists(_fileId) onlyFileOwner(_fileId) {
        require(sharedFiles[_fileId][_user].isActive, "User doesn't have access");
        
        sharedFiles[_fileId][_user].isActive = false;
        
        // Remove from sharedWith array
        address[] storage sharedList = fileSharedWith[_fileId];
        for (uint i = 0; i < sharedList.length; i++) {
            if (sharedList[i] == _user) {
                sharedList[i] = sharedList[sharedList.length - 1];
                sharedList.pop();
                break;
            }
        }
        
        emit AccessRevoked(_fileId, msg.sender, _user);
    }
    
    function logFileAccess(
        uint256 _fileId,
        string memory _action
    ) public fileExists(_fileId) hasAccess(_fileId) {
        fileAccessLogs[_fileId].push(AccessLog({
            fileId: _fileId,
            user: msg.sender,
            action: _action,
            timestamp: block.timestamp
        }));
        
        emit FileAccessed(_fileId, msg.sender, _action);
    }
    
    function deleteFile(uint256 _fileId) public fileExists(_fileId) onlyFileOwner(_fileId) {
        files[_fileId].isActive = false;
        
        emit FileDeleted(_fileId, msg.sender);
    }
    
    function setFilePublic(uint256 _fileId, bool _isPublic) public fileExists(_fileId) onlyFileOwner(_fileId) {
        files[_fileId].isPublic = _isPublic;
        
        emit FileStatusChanged(_fileId, _isPublic);
    }
    
    function getFileDetails(uint256 _fileId) public view fileExists(_fileId) returns (
        uint256 id,
        string memory fileHash,
        string memory fileName,
        uint256 fileSize,
        address fileOwner,
        uint256 timestamp,
        bool isActive,
        bool isPublic
    ) {
        File memory file = files[_fileId];
        return (
            file.id,
            file.fileHash,
            file.fileName,
            file.fileSize,
            file.owner,
            file.timestamp,
            file.isActive,
            file.isPublic
        );
    }
    
    function getUserFiles(address _user) public view returns (uint256[] memory) {
        return userFiles[_user];
    }
    
    function getFileSharedWith(uint256 _fileId) public view fileExists(_fileId) returns (address[] memory) {
        return fileSharedWith[_fileId];
    }
    
    function checkAccess(uint256 _fileId, address _user) public view fileExists(_fileId) returns (bool) {
        return files[_fileId].owner == _user || 
               files[_fileId].isPublic || 
               (sharedFiles[_fileId][_user].isActive && sharedFiles[_fileId][_user].sharedAt > 0);
    }
    
    function getFileAccessLogs(uint256 _fileId) public view fileExists(_fileId) returns (AccessLog[] memory) {
        return fileAccessLogs[_fileId];
    }
    
    function getFileCount() public view returns (uint256) {
        return fileCounter;
    }
}