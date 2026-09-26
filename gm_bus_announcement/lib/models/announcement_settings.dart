class AnnouncementSettings {
  String mode;
  List<String> languages;
  int secondsBeforeStop;
  AnnouncementSettings({this.mode = 'manual', this.languages = const ['GU'], this.secondsBeforeStop = 15});
}
