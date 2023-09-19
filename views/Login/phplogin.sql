CREATE DATABASE IF NOT EXISTS `phplogin` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `phplogin`;

CREATE TABLE IF NOT EXISTS `accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `activation_code` varchar(50) NOT NULL DEFAULT '',
  `rememberme` varchar(255) NOT NULL DEFAULT '',
  `role` enum('Member','Admin') NOT NULL DEFAULT 'Member',
  `registered` datetime NOT NULL,
  `last_seen` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

INSERT INTO `accounts` (`id`, `username`, `password`, `email`, `activation_code`, `rememberme`, `role`, `registered`, `last_seen`) VALUES
(1, 'admin', '$2y$10$ZU7Jq5yZ1U/ifeJoJzvLbenjRyJVkSzmQKQc.X0KDPkfR3qs/iA7O', 'admin@example.com', 'activated', '', 'Admin', '2023-01-01 00:00:00', '2023-01-01 00:00:00'),
(2, 'member', '$2y$10$yWKu95tLTnqdNhR/XfHtEekrjKJg2iVa8p65Da/EoijSPaFkRnmRG', 'member@example.com', 'activated', '', 'Member', '2023-01-01 00:00:00', '2023-01-01 00:00:00');