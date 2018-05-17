CREATE TABLE `system` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`activity` VARCHAR(500) NOT NULL DEFAULT '0',
	PRIMARY KEY (`id`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

set global max_connections=500;  
show variables like 'max_connections'; 

